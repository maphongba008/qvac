import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { useRef } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import RNPickerSelect from "react-native-picker-select";

export default function SelectInput({
  value,
  label,
  onChange,
  disabled,
  options,
}) {
  const pickerRef = useRef(null);

  const pressableStyle =
    Platform.OS === "ios" ? styles.textInputLanguage : styles.borderStyle;

  return (
    <View style={styles.languageContainerView}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable
        style={pressableStyle}
        onPress={() => {
          pickerRef.current.togglePicker(true);
        }}
      >
        <RNPickerSelect
          ref={pickerRef}
          value={value}
          disabled={disabled}
          onValueChange={(value, index) => {
            if (index === 0) return;

            onChange(value);
          }}
          items={options || []}
        />
        {Platform.OS === "ios" && (
          <AntDesign name="caretdown" size={12} color="black" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  languageContainerView: {
    flex: 1,
    gap: 8,
  },
  textInputLanguage: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    color: "black",
    borderColor: "lightgray",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
  },
  borderStyle: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "lightgray",
  },
  inputLabel: {
    fontWeight: "bold",
    color: "#5C666E",
  },
});
