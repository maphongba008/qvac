const HyperDriveDL = require("qvac-lib-dl-hyperdrive");
const MLCMarian = require("qvac-lib-inference-addon-mlc-marian");
const CoreStore = require("corestore");
const QvacMlcModelAddon = require("qvac-mlc-model-addon");

const { TRANSLATE, LOAD_MODEL, INIT_SOURCE } = require("./api");

function getConfig() {
  return {
    modelFilePath: QvacMlcModelAddon,
    weights: [
      "params_shard_0.bin",
      "params_shard_1.bin",
      "params_shard_2.bin",
      "params_shard_3.bin",
    ],
    settings: [
      "mlc-chat-config.json",
      "ndarray-cache.json",
      "vocab.json",
      "source.model",
      "target.model",
    ],
  };
}

let model;
let hdDL;

function initModelConfigSource({ dirPath }) {
  const pathToCoreStore = dirPath.substring("file://".length, dirPath.length);

  hdDL = new HyperDriveDL({
    key: "hd://a4ba71c061535d4b7481ec41f0deb1b8abd77fe4d49181c01b962c483bdba5dc", // TODO: Pass real key
    store: new CoreStore(pathToCoreStore),
  });

  console.log(">>> [initModelConfigSource]: hdDL initialized");
}

async function loadWeightsAndConfigs({ inputLanguage, outputLanguage }) {
  const modelFilesConfig = getConfig();

  const args = {
    loader: hdDL,
    params: { mode: "full", srcLang: inputLanguage, dstLang: outputLanguage },
    opts: { stats: true },
  };

  console.log(">>> [loadWeightsAndConfigs]: args loaded");

  model = new MLCMarian(args, modelFilesConfig);

  console.log(">>> [loadWeightsAndConfigs]: model created");

  console.time(">>> [loadWeightsAndConfigs]: model load time");
  await model.load();
  console.timeEnd(">>> [loadWeightsAndConfigs]: model load time");

  console.log(">>> [loadWeightsAndConfigs]: model loaded");
}

async function translateStream(text, req) {
  try {
    const reply = req.createResponseStream();

    const response = await model.run(text);

    for await (const output of response.iterate()) {
      reply.write(output);
    }

    const stats = response.stats;

    reply.end(`**end**::${JSON.stringify({ stats })}`);
  } catch (error) {
    console.error("Translation error:", error);
    req.reply("Error: " + error.toString());
  }
}

const rpc = new BareKit.RPC((req) => {
  switch (req.command) {
    case INIT_SOURCE:
      const directory = req?.data?.toString();
      initModelConfigSource({ dirPath: directory });
      req.reply("initialized");
      break;
    case LOAD_MODEL:
      const data = req?.data?.toString();
      const [inputLanguage, outputLanguage] = data?.split("::");
      loadWeightsAndConfigs({
        inputLanguage,
        outputLanguage,
      })
        .then(() => {
          req.reply("loaded");
        })
        .catch((error) => {
          console.log(">>> [LOAD_MODEL]: failed ", error);
          req.reply(`loading failed + ${error.toString()}`);
        });

      break;
    case TRANSLATE:
      const text = req?.data?.toString();
      translateStream(text, req).catch((error) => {
        req.reply("Error: " + error.toString());
      });
      break;
    default:
      req.reply("Hello from Bare!");
  }
});
