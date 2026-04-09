module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for Reanimated animations to work in a production APK
      'react-native-reanimated/plugin',
    ],
  };
};
