import type { ExpoConfig, ConfigContext } from 'expo/config';

// Cores hardcoded são permitidas APENAS aqui (camada de config nativa) e nos assets.
// Em código de UI, sempre tokens do theme (src/theme/tokens.ts).
const BG_LOWEST = '#10252D';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Actus',
  slug: 'actus',
  version: '0.1.0',
  scheme: 'actus', // deep link: actus://register?code=XXX
  owner: 'somo-tec',
  extra: {
    eas: {
      projectId: '0ea086da-f952-4141-a20f-ed0f814afbb5',
    },
  },
  orientation: 'portrait',
  userInterfaceStyle: 'dark', // dark mode é o único tema (quiet luxury)
  icon: './assets/icon.png', // [ASSET PENDENTE] gerar raster a partir do actus.svg
  backgroundColor: BG_LOWEST,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'br.tec.somo.actus',
  },
  android: {
    package: 'br.tec.somo.actus',
    adaptiveIcon: {
      backgroundColor: BG_LOWEST,
      foregroundImage: './assets/android-icon-foreground.png', // [ASSET PENDENTE]
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  experiments: {
    typedRoutes: true,
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png', // [ASSET PENDENTE] símbolo actus em neon
        backgroundColor: BG_LOWEST,
        imageWidth: 160,
      },
    ],
    '@react-native-community/datetimepicker',
    '@sentry/react-native',
    'react-native-edge-to-edge',
  ],
});
