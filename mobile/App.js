/**
 * App entry point.
 *
 * `mobile/package.json` declares `"main": "App.js"` so this file IS the bundle
 * root — Metro loads it first and `expo/AppEntry.js` is never touched. This
 * sidesteps the monorepo hoisting trap where `expo/AppEntry.js` (sitting in
 * `workspaceRoot/node_modules/expo/`) tries to `import App from "../../App"`
 * and resolves to a file that doesn't exist.
 *
 * What we do here:
 *   1. Mount `<ExpoRoot>` with a `require.context` pointing at the `./app`
 *      directory — that's how expo-router discovers the route tree. ExpoRoot
 *      cannot render without this context.
 *   2. Call `registerRootComponent` ourselves. Because we ARE the entry, no
 *      one else is going to do it. Without this call, React Native crashes
 *      with "main has not been registered".
 *
 * The `metro.config.js` `resolveRequest` hook that intercepts `../../App` is
 * a belt-and-braces safety net for debug harnesses (Android Studio, some VS
 * Code extensions) that may sneak AppEntry back into the bundle. If that
 * fires, AppEntry imports the default export below and calls
 * `registerRootComponent` a second time — `AppRegistry` treats that as an
 * overwrite, not an error, so it's safe.
 */

import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

export default function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
