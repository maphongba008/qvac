import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

export function ModelStateIndicator({ modelState }) {
  const indicatorStyles = {
    loading: "#e0e0e0",
    error: "#FFD2D2",
    ready: "#DFF0D8",
    unloaded: "#e2e2e2",
  };

  const indicatorContent = {
    loading: (
      <>
        <Text style={[styles.baseText, styles.loadingText]}>
          {"Loading Weights"}
        </Text>
        <ActivityIndicator size="small" color="black" />
      </>
    ),
    error: <Text style={[styles.baseText, styles.errorText]}>{"Error"}</Text>,
    ready: <Text style={[styles.baseText, styles.readyText]}>{"Ready"}</Text>,
    unloaded: (
      <Text style={[styles.baseText, styles.unloadedText]}>{"Unloaded"}</Text>
    ),
  };

  return (
    <View
      style={[
        styles.pillContainer,
        { backgroundColor: indicatorStyles[modelState] },
      ]}
    >
      {indicatorContent[modelState]}
    </View>
  );
}

const styles = StyleSheet.create({
  baseText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingText: {
    color: "#000000",
  },
  errorText: {
    color: "#A80000",
  },
  readyText: {
    color: "#34734C",
  },
  unloadedText: {
    color: "#000000",
  },
  pillContainer: {
    flexDirection: "row",
    width: "45%",
    gap: 8,
    background: "transparent",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    padding: 10,
    alignSelf: "flex-end",
  },
});
