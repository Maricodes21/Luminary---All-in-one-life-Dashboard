/**
 * Workspace-root entry shim.
 *
 * Why this file exists at the workspace root:
 *   The `expo` package is hoisted by npm workspaces to `multi-app/node_modules/expo/`.
 *   `expo/AppEntry.js` does `import App from '../../App'` — which resolves
 *   to `multi-app/App.js` (this file), NOT `multi-app/mobile/App.js`.
 *
 *   Expo Go and several debug harnesses (Android Studio's build, some VS Code
 *   extensions) bypass the `main` field in `mobile/package.json` and use
 *   AppEntry.js directly, so we must give AppEntry a real file at the path
 *   it expects. Metro's `resolveRequest` hook in `mobile/metro.config.js`
 *   tries to intercept this, but it isn't always loaded in those bundler
 *   contexts. This file is the durable fix.
 *
 * What it does:
 *   Re-exports the default from `mobile/App.js`, which is where the real
 *   `<ExpoRoot>` component is defined (with the `require.context('./app')`
 *   that gives expo-router the route tree).
 */

export { default } from './mobile/App';
