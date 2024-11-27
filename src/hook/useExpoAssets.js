import { useEffect, useState } from "react";
import { Asset } from "expo-asset";

export const useExpoAssets = () => {
  const [assetsUri, setAssetsUri] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadAssetsAsync() {
    try {
      const asset = await Asset.loadAsync([
        require("../../node_modules/ai-bare-translation/model/marian/vulkan/en-it/opus-mt-en-it.so"),
        require("../../node_modules/ai-bare-translation/model/marian/vulkan/en-it/params_shard_0.bin"),
        require("../../node_modules/ai-bare-translation/model/marian/vulkan/en-it/params_shard_1.bin"),
        require("../../node_modules/ai-bare-translation/model/marian/vulkan/en-it/params_shard_2.bin"),
        require("../../node_modules/ai-bare-translation/model/marian/vulkan/en-it/params_shard_3.bin"),
        require("../../node_modules/ai-bare-translation/model/marian/vulkan/en-it/params_shard_4.bin"),
        require("../../node_modules/ai-bare-translation/model/marian/vulkan/en-it/params_shard_5.bin"),
        require("../../node_modules/ai-bare-translation/model/marian/vulkan/en-it/source.model"),
        require("../../node_modules/ai-bare-translation/model/marian/vulkan/en-it/target.model"),
      ]);

      const assetsUri = asset.map((asset) => asset.localUri);
      setAssetsUri(assetsUri);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading assets:", error);
    }
  }

  useEffect(() => {
    loadAssetsAsync();
  }, []);

  return { assetsUri, isLoading };
};
