const HyperDriveDL = require("qvac-lib-dl-hyperdrive");
const Hyperswarm = require("hyperswarm");
const Hyperbee = require("hyperbee");
const CoreStore = require("corestore");
const b4a = require("b4a");
const {
  MLCMarianOpusQ4F16,
} = require("@tetherto/qvac-lib-inference-addon-mlc-marian-opus-q4f16");
const RPC = require("bare-rpc");

const { TRANSLATE, LOAD_MODEL, INIT_SOURCE } = require("./api");
const { HYPERBEE_KEY } = require("./constants");

function getConfig() {
  return {
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
let db;
let store;

async function initModelConfigSource({ dirPath, inputLang, outputLang }) {
  const pathToCoreStore = dirPath.substring("file://".length, dirPath.length);

  if (db && store) {
    console.log(
      ">>> [initModelConfigSource]: db and store already initialized switching model config source"
    );
    return await switchModelConfigSource({ inputLang, outputLang });
  }

  store = new CoreStore(pathToCoreStore);

  console.log(">>> [initModelConfigSource]: coreStore initialized");

  core = store.get({ key: b4a.from(HYPERBEE_KEY, "hex") });

  console.log(">>> [initModelConfigSource]: coreStore.get called");

  await core.ready();

  console.log(">>> [initModelConfigSource]: core ready");

  db = new Hyperbee(core, {
    keyEncoding: "utf-8",
    valueEncoding: "binary",
  });

  await db.ready();

  console.log(">>> [initModelConfigSource]: db ready");

  const swarm = new Hyperswarm();

  swarm.on("connection", (conn) => {
    console.log("new connection");

    db.replicate(conn);
  });

  console.log(">>> [initModelConfigSource]: swarm on called");

  const foundPeers = db.core.findingPeers();

  console.log(">>> [initModelConfigSource]: foundPeers loaded");

  swarm.join(db.discoveryKey, { client: true, server: false });

  console.log(">>> [initModelConfigSource]: swarm joined");

  foundPeers();

  console.log(">>> [initModelConfigSource]: foundPeers called");

  await new Promise((resolve) => setTimeout(resolve, 10000));

  await switchModelConfigSource({ inputLang, outputLang });
}

async function switchModelConfigSource({ inputLang, outputLang }) {
  const driveKey = await db.get(`${inputLang}-${outputLang}`);

  console.log(">>> [switchModelConfigSource]: drive key", driveKey);

  console.log(
    ">>> [switchModelConfigSource]: driveKey",
    b4a.toString(driveKey.value, "hex")
  );

  hdDL = null;

  hdDL = new HyperDriveDL({
    key: `hd://${b4a.toString(driveKey.value, "hex")}`,
    store,
  });

  await hdDL.ready();

  console.log(">>> [switchModelConfigSource]: hdDL initialized");
}

async function loadWeightsAndConfigs({ inputLanguage, outputLanguage }) {
  const modelFilesConfig = getConfig();

  await hdDL.ready();
  console.log(">>> [loadWeightsAndConfigs]: hdDL ready");

  const args = {
    loader: hdDL,
    params: { mode: "full", srcLang: inputLanguage, dstLang: outputLanguage },
    opts: { stats: true },
  };

  console.log(">>> [loadWeightsAndConfigs]: args loaded");

  model = new MLCMarianOpusQ4F16(args, modelFilesConfig);

  console.log(
    ">>> [loadWeightsAndConfigs]: model created with",
    args,
    modelFilesConfig
  );

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

const rpc = new RPC(BareKit.IPC, (req) => {
  switch (req.command) {
    case INIT_SOURCE:
      const [directory, inputLang, outputLang] = req?.data
        ?.toString()
        .split("::");

      console.log(">>> [INIT_SOURCE]: directory", directory);

      initModelConfigSource({ dirPath: directory, inputLang, outputLang })
        .then(() => {
          req.reply("initialized");
        })
        .catch((error) => {
          console.log(">>> [INIT_SOURCE]: failed ", error);
          req.reply(`initialization failed + ${error.toString()}`);
        });
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
