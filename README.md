# Running qvac-translation-poc on mobile

First of all make sure you have your environment set up for running an Expo React Native application.

Instructions here
https://docs.expo.dev/get-started/set-up-your-environment/

After making sure you have the environment ready follow the below instructions:

## **Clone the Repository**

Open your terminal or command prompt.

Clone this repository.

Navigate to the cloned repository directory:

Checkout to mobile branch

```sh
 git checkout mobile
```

## **Install Dependencies**

Ensure you have the required package manager installed (e.g., `npm` for Node.js).

Run the following command to install the necessary dependencies:

```sh
 npm install
```

> [!WARNING]
> obs: there are 3 .tgz files inside the repo that will be installed as local packages, as soon as those packages are avaible on npm registry the `package.json` should be updated with the correct path to get those packages from npm instead of installing locally.

## **Running the Application on Android**

Start the application by running the following command:

```sh
 npm start
```

If you need a clean start you can also run

```sh
 npm run start:clean
```

In another terminal run

```sh
 npm run android
```

This will intrinsectly run `npm run bundle:android` and `npm run bundle:ios` that is required to generate/update `app-android.bundle` file and `app-ios.bundle` file before running the app.

Also if that is the first time you are running it expo will create the native project inside your rn project, the same happens for ios.

## **Running the Application on iOS**

Start the application by running the following command:

```sh
npm start
```

If you need a clean start you can also run

```sh
npm run start:clean
```

In another terminal run

```sh
npm run ios
```

This will intrinsectly run `npm run bundle:android` and `npm run bundle:ios` that is required to generate/update `app-android.bundle` file and `app-ios.bundle` file before running the app.

Also if that is the first time you are running it expo will create the native project inside your rn project, the same happens for android.
