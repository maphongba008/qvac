import { useRef, useState, useEffect } from "react";
import { Worklet } from "react-native-bare-kit";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { Platform } from "react-native";
const RPC = require("bare-rpc");

const noReply = () => {
  /* No reply */
};

const useWorklet = (callback = noReply) => {
  const worklet = new Worklet();

  const rpcRef = useRef(null);

  const [fileUri, setFileUri] = useState();
  const [directoryPath, setDirectoryPath] = useState(null);
  const [rpcReady, setRPCReady] = useState(false);

  useEffect(() => {
    loadFileSystem().then(() => {
      loadAssetByPlatform();
    });
  }, []);

  useEffect(() => {
    if (!fileUri) return;

    worklet.start(fileUri).then(() => {
      if (!rpcRef.current) {
        rpcRef.current = new RPC(worklet.IPC, callback);
        setRPCReady(true);
      }
    });
  }, [fileUri]);

  const ensureDirectoryExist = async (dirPath) => {
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
  };

  const loadFileSystem = async () => {
    const coreStorePath = `${FileSystem.documentDirectory}weights/`;
    await ensureDirectoryExist(coreStorePath);
    setDirectoryPath(coreStorePath);
  };

  async function loadAssetByPlatform() {
    const assetByPlatform =
      Platform.OS === "ios"
        ? require("../../worklet/app-ios.bundle")
        : require("../../worklet/app-android.bundle");

    const [asset] = await Asset.loadAsync([assetByPlatform]);

    setFileUri(asset.localUri);
  }

  return [rpcRef.current, rpcReady, directoryPath];
};

export default useWorklet;
