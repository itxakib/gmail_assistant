module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-worklets/plugin', // For react-native-reanimated v4+, use worklets plugin instead
    ],
  };
};
