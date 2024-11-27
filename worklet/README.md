## Use worklet

Bare code is run through a separate process (like web worker) called `worklet`.

For common usage:

1. write bare runtime code in `worklet/` and follow the Common JS pattern (Node JS), the entrypoint is `app.cjs`.
2. To run with React native UI, we'll bundle codes under worklet/ by call `./script/bundle_worklet.sh` from root. (do automatically with `yarn android` command)

## Use Addon

Addon also need to be bundled. For common usage:

1. put addon in root folder
2. (if a local package) npm install ./addon.x.x.x.tgz
3. call `./script/install_addon.sh` from root (need change `ADDON_NAME` if different) (do automatically with `yarn android` command)

----

## Compile Addon

bare-addon-1.0.0.tgz is compiled from [bare-addon](https://github.com/holepunchto/bare-addon) sample project.


Can follow below commands to pack for android addon

```sh
npm install -g bare-runtime bare-dev
git clone https://github.com/holepunchto/bare-addon.git
cd bare-addon
npm install
bare-dev install --platform android --arch arm64 --android-ndk 26.1.10909125 --android-api 34
npm pack
```
