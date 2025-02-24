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

import useWorklet from "../hook/useWorklet";
import { TRANSLATE, LOAD_MODEL, INIT_SOURCE } from "../../worklet/api";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import SelectInput from "../components/SelectInput";
import b4a from "b4a";
import { ModelStateIndicator } from "../components/ModelStateIndicator";
import { Translator } from "../hook/Translator";

const translate = (rpc, inputText, cb) => {
  console.log("translate text", inputText);
  const req = rpc.request(TRANSLATE);
  req.send(JSON.stringify(inputText));
  const reply = req.createResponseStream();
  let text = "";
  reply
    .on("data", (data) => {
      const incomingData = b4a.toString(data);
      text += incomingData;
    })
    .on("end", () => {
      Alert.alert("Translated", text);
      cb();
      // cleanupTranslation();
    });
};

async function setup(rpc, directoryPath) {
  console.log("initModelConfigSource", directoryPath);
  const req = rpc.request(INIT_SOURCE);

  req.send(`${directoryPath}::en::it`);
  const res = await req.reply("utf8");
  if (res !== "initialized") {
    Alert.alert("Init model source failed", res);
    return;
  }

  const req2 = rpc.request(LOAD_MODEL);

  req2.send(`en::it`);

  const res2 = await req2.reply("utf8");
  if (res2 !== "loaded") {
    Alert.alert("Load model failed", res2);
    return;
  }
}

function App() {
  const [rpc, rpcReady, directoryPath] = useWorklet();
  const [translating, setTranslating] = useState(false);
  const [canSend, setCanSend] = useState(false);

  // possible modelState loading, ready, error
  const [modelState, setModelState] = useState("loading");

  const init = () => {
    setup(rpc, directoryPath).then(() => {
      setModelState("ready");
    });
  };

  useEffect(() => {
    setCanSend(!translating);
  }, [translating]);
  console.log("render APP");

  const handleTranslate = () => {
    setTranslating(true);
    translate(rpc, "Hello", () => {
      setTranslating(false);
    });
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: StatusBar.currentHeight,
      }}
    >
      <ModelStateIndicator modelState={modelState} />
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.blueButton]}
          onPress={init}
        >
          <Text style={styles.text}>Setup</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.blueButton]}
          onPress={handleTranslate}
        >
          <Text style={styles.text}>Translate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default App;
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
