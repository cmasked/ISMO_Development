# ISMO Android application

React Native with Expo SDK 54, React 19.1 and React Native 0.81. Android uses the existing NestJS API and PostgreSQL database. No new backend, mock API, local project/task database or invented fields are introduced.

## Run

Use Node.js 22, Java 17 and an Android SDK/emulator for local native builds.

```sh
cd mobile
cp .env.example .env
npm ci
npx expo run:android
```

The only application environment variable is:

```env
EXPO_PUBLIC_API_BASE_URL=https://ismo-development.onrender.com/api
```

It is public build configuration. Never put database passwords or JWT signing secrets in the mobile app. Native requests use bearer tokens and do not need browser CORS configuration.

You may also use `npx expo start` with a compatible Expo Go version. A generated native build provides the most reliable Android verification.

## Installable APK

The Android GitHub Actions workflow builds a production-mode APK with the deployed HTTPS API URL and stores it as the `ismo-android-apk` artifact. Download and extract the artifact, transfer `app-release.apk` to an Android device, and install it. CI uses the generated development signing key: the artifact is for sideloaded demos, not Play Store submission.

For a local demo APK:

```sh
npm run prebuild:android
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64
```

The generated APK is at `android/app/build/outputs/apk/release/app-release.apk`. Generated Android files are intentionally ignored; Expo config and source files are committed.

For managed signing and distribution, use your Expo account:

```sh
npx eas-cli@latest build --platform android --profile preview
```

The `production` EAS profile builds an AAB for a future Play Store release. Keep signing credentials private and reuse the same production key for app updates. This implementation does not create an Expo account or publish to a store.

## Features

- Register, sign in, restore authentication, sign out and handle invalid/expired sessions.
- Dashboard with exactly the five supported backend counts.
- Project search/status filters, creation, editing, deletion and details.
- Tasks within projects and across the workspace, combined name/status/priority/project filters, creation, editing, movement, deletion and completion/status changes.
- Native Android date selection, keyboard-aware forms, useful loading/error/empty states and deletion confirmations.
- Persistent light/dark preferences with the shared cream, black, yellow, red and blue Bauhaus identity. Space Grotesk and Inter fonts are bundled.
- Pull-to-refresh, refresh after mutations and refresh when returning from the background. Web and Android see each other's committed changes through the same endpoints.

## Security and network behavior

Auth tokens, expiry and user metadata use Expo SecureStore backed by Android encrypted storage. AsyncStorage holds only the appearance preference. Passwords stay in transient form state and are never persisted or logged.

Protected navigation is rebuilt when authentication changes. Query caches clear on account changes/sign-out. Requests use cancellation, a 30-second timeout and friendly errors; mutations are not automatically retried. Offline/unavailable-backend states preserve saved authentication for a later retry. Logout revokes the server session before clearing device authentication; a network failure leaves the session intact and shows an error.

Production builds require HTTPS, reject localhost/private development hosts and disable cleartext traffic. CI uses a distinct `com.ismo.projects.e2e` package and explicitly restricted emulator configuration. Unnecessary microphone, storage, overlay and biometric permissions are blocked. Authorization remains enforced by the backend.

Project status is managed explicitly. Task completion percentages use real tasks and never change project status. Blank optional descriptions/dates are sent as null. Calendar dates preserve their local calendar day.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run export
```

For real API contract checks, first start a migrated isolated backend/database, then run:

```sh
MOBILE_TEST_API_URL=http://127.0.0.1:3001/api npm run test:integration
```

Never target production with the integration suite. It creates synthetic accounts and records and exercises deletion. CI supplies ephemeral PostgreSQL, a random masked signing key, native debug/release builds and a Maestro emulator flow. The test build points to the isolated backend; the installable APK uses the deployed backend. Native reports, screenshots and APKs are workflow artifacts.

The native flow covers registration, login, project/task creation, editing, completion, combined filters, theme switching, authentication after relaunch and logout persistence. The browser/native cross-platform flow signs into the actual web app with the same account, verifies Android changes, creates a web task, verifies and edits it on Android, and checks the result on web. API integration tests separately cover counts, relationships, cascade deletion and invalid session clearing.

## Structure

`src/auth` owns authentication lifecycle; `src/lib` contains the typed API client, secure session controller, query hooks and validation; `src/components` contains themed native controls; `src/navigation` configures stacks/tabs; `src/features` contains reusable project/task views; `src/screens` contains the user flows.

Backend and web source remain unchanged. Original assignment uploads were unavailable in the failed execution workspace; scope follows the pasted mobile checklist and inspected API contract.
