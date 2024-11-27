import { StyleSheet, View, Modal, TouchableOpacity } from "react-native";

export function SettingsModal({ visible, onClose, children }) {
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.centeredView}
        onPress={onClose}
      ></TouchableOpacity>
      <View style={styles.modalView}>{children}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalView: {
    height: "30%",
    width: "100%",
    alignItems: "center",
    backgroundColor: "#404E6B",
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    padding: 16,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
});
