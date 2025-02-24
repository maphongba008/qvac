import { useRef, useState, useEffect } from "react";
import { Worklet } from "react-native-bare-kit";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { Platform } from "react-native";
import { TRANSLATE, LOAD_MODEL, INIT_SOURCE } from "../../worklet/api";
import b4a from "b4a";

const RPC = require("bare-rpc");

let rpc;
const worklet = new Worklet();
const getCoreStorePath = () => {
  const path = `${FileSystem.documentDirectory}weights/`;
  FileSystem.getInfoAsync(path).then((info) => {
    if (!info.exists) {
      FileSystem.makeDirectoryAsync(path);
    }
  });
  return path;
};

const getBundleUri = async () => {
  const assetByPlatform =
    Platform.OS === "ios"
      ? require("../../worklet/app-ios.bundle")
      : require("../../worklet/app-android.bundle");

  const [asset] = await Asset.loadAsync([assetByPlatform]);
  return asset.localUri;
};

const coreStorePath = getCoreStorePath();
let isWorkletStarted = false;
const startWorklet = async () => {
  if (isWorkletStarted) {
    return;
  }
  await worklet.start(await getBundleUri());
  rpc = new RPC(worklet.IPC, () => {});
  isWorkletStarted = true;
};

const initTranslationSource = async (src, dest) => {
  try {
    await startWorklet();
    const query = [coreStorePath, src, dest].join("::");
    console.log("query", query);
    const req = rpc.request(INIT_SOURCE);
    req.send(query);
    const res = await req.reply("utf8");
    const success = res === "initialized";
    return {
      success,
      error: success ? undefined : res,
    };
  } catch (e) {
    console.log(e);
    return {
      success: false,
      error: e.message,
    };
  }
};

const loadTranslationModel = async (src, dest) => {
  try {
    const query = [src, dest].join("::");
    console.log("send query", query);
    const req = rpc.request(LOAD_MODEL);
    req.send(query);
    const res = await req.reply("utf8");
    const success = res === "loaded";
    return {
      success,
      error: success ? undefined : res,
    };
  } catch (e) {
    console.log(e);
    return {
      success: false,
      error: e.message,
    };
  }
};

const translate = (text) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = {
        stats: 0,
        translatedText: "",
      };
      console.log("rpc", rpc);
      const req = rpc.request(TRANSLATE);
      console.log("req", req);
      req.send(JSON.stringify(text));

      const reply = await req.createResponseStream();

      reply
        .on("data", (data) => {
          console.log("onData");
          const incomingData = b4a.toString(data);
          if (incomingData.includes("**end**")) {
            const statsData = incomingData.split("::")[1];
            const { stats } = JSON.parse(statsData);
            response.stats = parseFloat(
              stats.totalTokens / stats.totalTime
            ).toFixed(2);
            return;
          }
          response.translatedText += `${prev} ${incomingData}`;
        })
        .on("end", () => {
          console.log("onEnd", response);
          resolve(response);
        });
    } catch (e) {
      console.log(e);
    }
  });
};

export const Translator = {
  initTranslationSource,
  loadTranslationModel,
  translate,
};
