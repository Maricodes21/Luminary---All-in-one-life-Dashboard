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
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Worklets plugin must be the LAST entry.
      'react-native-worklets/plugin',
    ],
  };
};
