// Metro configured for our npm workspaces monorepo.
//
// What this gives us:
//   1. Watches the entire repo so changes in `packages/design-system` hot-reload
//      inside the mobile app without a manual restart.
//   2. Resolves modules from BOTH the mobile app's local node_modules AND the
//      hoisted root node_modules, which is where npm workspaces places
//      shared/transitive deps.
//
// IMPORTANT: do NOT add `disableHierarchicalLookup: true`. It forces Metro to
// stop walking up from the source file's directory, which breaks resolution of
// transitive deps that React Native reaches for (e.g. @react-native/virtualized-lists
// imported from inside react-native's own FlatList.js). The default hierarchical
// walk plus our explicit paths is the right combination for this monorepo.
//
// References:
//   https://docs.expo.dev/guides/monorepos/
//   https://github.com/expo/examples/tree/master/with-yarn-workspaces

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (so design-system edits hot-reload).
config.watchFolders = [workspaceRoot];

// 2. Let Metro resolve modules from the local app AND the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// In an npm workspace, `expo` is hoisted to the workspace root.
// expo/AppEntry.js resolves "../../App" relative to *its own location*
// (workspaceRoot/node_modules/expo/), which points at workspaceRoot/App —
// a file that doesn't exist. We intercept that specific import and pin it
// to mobile/App.js so expo-router can take over rendering.
// We handle two custom resolution cases here:
//
//  1. expo/AppEntry workspace-hoisting trap (see App.js comment for full story).
//
//  2. The `@/*` path alias declared in tsconfig.json. We do NOT rely on Expo's
//     `experiments.tsconfigPaths` because that experiment normalizes paths with
//     POSIX separators and silently no-ops on Windows when the importer has
//     backslashes. Resolving aliases here works on every platform and survives
//     all the dev-server entry points (expo start, RN Tools, Mobile View).
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // (1) Pin expo/AppEntry's `../../App` lookup to mobile/App.js
  if (
    moduleName === '../../App' &&
    context.originModulePath.replace(/\\/g, '/').includes('node_modules/expo/AppEntry')
  ) {
    return { filePath: path.resolve(projectRoot, 'App.js'), type: 'sourceFile' };
  }

  // (2) Rewrite `@/...` to a relative path from the importer so Metro's
  // default resolver handles extension lookup (.ts/.tsx/.js/.jsx/index.*)
  if (moduleName.startsWith('@/')) {
    const target = path.resolve(projectRoot, moduleName.slice(2));
    const fromDir = path.dirname(context.originModulePath);
    let rel = path.relative(fromDir, target).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    return context.resolveRequest(context, rel, platform);
  }

  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
