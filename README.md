# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside **src/app**. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Scam Guard

The **Fraud detection** page connects to the Scam Guard Raspberry Pi service documented in
[`mobile_integration.md`](https://github.com/arjunkeerthi1529/wakeword-test/blob/main/docs/mobile_integration.md).
Open it from Home, enter the Pi address (for example `http://192.168.1.20:8000`), connect, then start monitoring
with the phone call on speaker near the Pi microphone. The page displays live transcript and model/rule warnings;
analysis and audio stay on the Pi.

The Pi and phone must be on the same trusted private network. The service currently has no authentication or
encryption. Keep the app open during a monitored call: this integration does not add an Android foreground service
or push notifications, and iOS may suspend its socket in the background. For simulator testing, the backend guide
documents its simulator and platform-specific host addresses.

The app's Expo config includes local-network access settings for iOS and cleartext HTTP to the local Pi on Android.
Rebuild the native app for those settings to take effect; they are not applied by Expo Go.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
