const { createRequire } = require('module');
const path = require('path');

const mobileRequire = createRequire(path.join(__dirname, 'mobile', 'package.json'));
const expoRequire = createRequire(mobileRequire.resolve('expo/package.json'));

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [expoRequire.resolve('babel-preset-expo')],
    plugins: [
      // Worklets plugin must be the LAST entry.
      mobileRequire.resolve('react-native-worklets/plugin'),
    ],
  };
};
