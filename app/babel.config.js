// SDK 55: babel-preset-expo já configura o Reanimated/worklets automaticamente.
// NÃO declarar 'react-native-reanimated/plugin' nem 'react-native-worklets/plugin' aqui —
// plugin duplicado é o erro de build mais comum.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['react-native-unistyles/plugin', { root: 'src' }]],
  };
};
