# LOW ONE · Android wrapper

This directory builds an initial Android debug APK with Capacitor.

## What this APK is

- It is a native Android WebView shell named LOW ONE.
- It loads the current hosted LOW application at `https://low-ko7kz4.v2.appdeploy.ai`.
- An internet connection is required.
- The application logic and backend remain hosted; this is not an offline-native port.
- AppDeploy sign-in and OAuth behavior must be validated on a physical Android device before calling this production-ready.
- The workflow creates an unsigned debug APK for testing. A Play Store/release APK or AAB needs a protected signing keystore and a separate release workflow.

## Build

GitHub Actions runs on pushes to `low-one-android-apk` that change this folder or the workflow. It also supports manual dispatch from the Actions tab.

The artifact is named `low-one-debug-apk`. Download the artifact ZIP from the successful workflow run and extract `app-debug.apk`.

## Local build

Requires Node.js 22, Java 21, Android SDK, and Android build tools:

```bash
npm install
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

Do not commit signing keys, passwords, API keys, or generated keystores.
