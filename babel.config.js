module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Le plugin worklets (Reanimated v4) DOIT rester en dernier
    plugins: ['react-native-worklets/plugin'],
  };
};
