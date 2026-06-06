const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// Config base com Sentry (source maps + symbolication)
const config = getSentryExpoConfig(__dirname);

// SVG como componente React (react-native-svg-transformer)
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
// Testes co-locados (*.test.tsx / *.spec.tsx dentro de app/) NÃO podem virar
// rotas: o Expo Router enumera app/ via require.context e, em dev web (import
// mode `sync`), carrega cada rota para validar o default export — importar um
// arquivo de teste executa o guard de peer-deps do @testing-library e quebra o
// boot. O blockList vira o `ignorePattern` do file-map do Metro, então esses
// arquivos somem do require.context (o jest tem config própria e não é afetado).
const testSpecFiles = /\.(test|spec)\.[jt]sx?$/;
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  blockList: config.resolver.blockList
    ? [config.resolver.blockList].flat().concat(testSpecFiles)
    : testSpecFiles,
};

module.exports = config;
