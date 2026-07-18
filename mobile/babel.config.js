/**
 * Babel config for Expo SDK 54.
 *
 * Reanimated 4 split its babel plugin out into `react-native-worklets`. The
 * plugin must remain LAST in the plugins array — anything after it breaks
 * worklet detection.
 *
 * If you upgrade Reanimated again later, double-check this path against the
 * release notes.
 */
const { createRequire } = require('module');

const expoRequire = createRequire(require.resolve('expo/package.json'));
const { expoRouterBabelPlugin } = expoRequire('babel-preset-expo/build/expo-router-plugin');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [expoRequire.resolve('babel-preset-expo')],
    plugins: [
      expoRouterBabelPlugin,
      // Worklets plugin must be the LAST entry.
      require.resolve('react-native-worklets/plugin'),
    ],
  };
};
