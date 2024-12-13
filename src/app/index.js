import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useCallback, useRef, useEffect, useState } from "react";
import { useNavigation } from "expo-router";

import useWorklet from "../hook/useWorklet";
import { TRANSLATE, LOAD_MODEL, INIT_SOURCE } from "../../worklet/api";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import SelectInput from "../components/SelectInput";
import b4a from "b4a";
import { ModelStateIndicator } from "../components/ModelStateIndicator";

export default function App() {
  const [rpc, rpcReady, directoryPath] = useWorklet();
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [stats, setStats] = useState("");
  const [translating, setTranslating] = useState(false);
  const [canSend, setCanSend] = useState(false);

  // possible modelState loading, ready, error
  const [modelState, setModelState] = useState("loading");

  const [languagePair, setLanguagePair] = useState("en-it");
  const navigation = useNavigation();
  const scrollViewRef = useRef();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Entypo.Button
          style={{ margin: 0, backgroundColor: "white" }}
          iconStyle={{ marginRight: 0, alignSelf: "flex-end" }}
          name="dots-three-vertical"
          size={20}
          color="black"
          onPress={() => {
            setSettingsModalVisible(true);
          }}
        />
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (!rpcReady) return;
    initModelConfigSource();
  }, [rpcReady]);

  useEffect(() => {
    if (modelState === "loading") return;
    initModelConfigSource();

    setTranslatedText("");
    setInputText("");
  }, [languagePair]);

  useEffect(() => {
    setCanSend(
      rpc && inputText !== "" && !translating && modelState === "ready"
    );
  }, [rpc, inputText, translating, modelState]);

  function initModelConfigSource() {
    if (!directoryPath || !rpc) return;

    setModelState("loading");

    const req = rpc.request(INIT_SOURCE);

    const inputLanguage = languagePair.split("-")[0];
    const outputLanguage = languagePair.split("-")[1];

    req.send(`${directoryPath}::${inputLanguage}::${outputLanguage}`);
    req
      .reply("utf8")
      .then((res) => {
        if (res === "initialized") {
          console.log(">>> [UI] initModelConfigSource: ", res);
          loadModel();
        }
      })
      .catch((err) => {
        console.log(">>> [UI] initModelConfigSource: error ->", err);
      });
  }

  function updateLanguagePair({ value, from }) {
    if (from === "input") {
      setLanguagePair(`${value}-${languagePair.split("-")[1]}`);
    } else {
      setLanguagePair(`${languagePair.split("-")[0]}-${value}`);
    }
  }

  function swapLanguages() {
    if (modelState === "loading") return;
    const [from, to] = languagePair.split("-");
    setLanguagePair(`${to}-${from}`);
  }

  function cleanupTranslation() {
    setTranslatedText((prev) => {
      let text = prev.trim();
      if (text.startsWith('"') && text.endsWith('"')) {
        text = text.slice(1, -1);
      }
      return text;
    });
  }

  function loadModel() {
    console.log(">>> [UI] loadModel: ", languagePair);
    if (!directoryPath) return;

    const req = rpc.request(LOAD_MODEL);
    const inputLanguage = languagePair.split("-")[0];
    const outputLanguage = languagePair.split("-")[1];

    req.send(`${inputLanguage}::${outputLanguage}`);

    req
      .reply("utf8")
      .then((res) => {
        if (res === "loaded") {
          setModelState("ready");
        } else {
          setModelState("error");
          Alert.alert("Load model failed", res);
        }
      })
      .catch((err) => {
        console.log(">>> [UI]: loadModel error ", err);
        setModelState("error");
      });
  }

  const handleTranslate = useCallback(() => {
    if (!canSend) return;
    setTranslating(true);
    setTranslatedText("");
    setStats(null);

    const req = rpc.request(TRANSLATE);
    req.send(JSON.stringify(inputText));

    const reply = req.createResponseStream();

    reply
      .on("data", (data) => {
        const incomingData = b4a.toString(data);
        if (incomingData.includes("**end**")) {
          const statsData = incomingData.split("::")[1];
          const { stats } = JSON.parse(statsData);
          setStats(parseFloat(stats.totalTokens / stats.totalTime).toFixed(2));
          return;
        }
        setTranslatedText((prev) => `${prev} ${b4a.toString(data)}`);
      })
      .on("end", () => {
        setTranslating(false);
        cleanupTranslation();
      });
  }, [rpc, inputText, canSend]);

  const handleClearInput = () => {
    setInputText("");
    setTranslatedText("");
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(translatedText);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: StatusBar.currentHeight,
      }}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        onContentSizeChange={() => {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }}
      >
        <StatusBar style="auto" />
        <View style={styles.inputContainer}>
          <ModelStateIndicator modelState={modelState} />

          <View style={styles.languageContainer}>
            <SelectInput
              value={languagePair.split("-")[0]}
              label="Input Language"
              disabled={modelState === "loading"}
              options={[
                { label: "English", value: "en" },
                { label: "Italian", value: "it" },
                { label: "German", value: "de" },
              ].filter((lang) => lang.value !== languagePair.split("-")[1])}
              onChange={(value) => {
                updateLanguagePair({ value, from: "input" });
              }}
            />
            <View style={styles.languageContainerSeparator}>
              <AntDesign
                style={{
                  marginTop: 20,
                  alignSelf: "center",
                }}
                name="swap"
                size={25}
                color="black"
                onPress={swapLanguages}
              />
            </View>
            <SelectInput
              label="Output Language"
              placeholder={{}}
              disabled={modelState === "loading"}
              value={languagePair.split("-")[1]}
              options={[
                { label: "English", value: "en" },
                { label: "Italian", value: "it" },
                { label: "German", value: "de" },
              ].filter((lang) => lang.value !== languagePair.split("-")[0])}
              onChange={(value) => {
                updateLanguagePair({ value, from: "output" });
              }}
            />
          </View>

          <View style={styles.customTextInput}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputLabel}>Input Text</Text>
              <TouchableOpacity onPress={handleClearInput}>
                <MaterialIcons name="delete" size={24} color="gray" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              multiline
              onChangeText={setInputText}
              value={inputText}
              placeholder="Type the text to translate"
            />
          </View>
        </View>
        {translatedText && (
          <View style={styles.outputContainer}>
            <AntDesign
              style={{ alignSelf: "center" }}
              name="arrowdown"
              size={24}
              color="black"
            />
            <View style={styles.customTextInput}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Translated Text</Text>
                <TouchableOpacity onPress={handleCopy}>
                  <MaterialIcons name="content-copy" size={24} color="gray" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.textInput}
                multiline
                editable={false}
                value={translatedText}
                placeholder="The translation string will appear here"
              />
            </View>

            {stats && (
              <View style={styles.statsContainer}>
                <Text style={styles.statText}>Speed: {stats} tokens/s</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            canSend ? styles.blueButton : styles.greyButton,
          ]}
          disabled={!canSend}
          onPress={handleTranslate}
        >
          <Text style={styles.text}>Translate</Text>
          {translating && <ActivityIndicator size="small" color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#FFFFFF",
  },
  inputContainer: {
    gap: 8,
    width: "100%",
  },
  outputContainer: {
    gap: 8,
    width: "100%",
  },
  statText: {
    alignSelf: "flex-end",
    paddingRight: 10,
    color: "#314D9F",
    fontWeight: "bold",
    padding: 5,
  },
  textInput: {
    minHeight: 100,
    borderColor: "lightgray",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    textAlignVertical: "top",
    color: "#000000",
  },
  inputHeader: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputLabel: {
    fontWeight: "bold",
    color: "#5C666E",
  },
  languageContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  languageContainerSeparator: {
    flex: 0.4,
    alignSelf: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
    backgroundColor: "#FFFFFF",
  },
  button: {
    flex: 1,
    padding: 10,
    gap: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  blueButton: {
    backgroundColor: "#3A83F5",
  },
  greyButton: {
    backgroundColor: "#d3d3d3",
  },
  statsContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#DCEAFC",
    color: "##314D9F",
    borderRadius: 5,
  },
  customTextInput: {
    gap: 8,
  },
});
