const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// Config base com Sentry (source maps + symbolication)
const config = getSentryExpoConfig(__dirname);

// SVG como componente React (react-native-svg-transformer)
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = config;
