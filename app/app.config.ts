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
  icon: './assets/icon.png', // símbolo Actus neon sobre BG_LOWEST (scripts/gen-brand-assets.mjs)
  backgroundColor: BG_LOWEST,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'br.tec.somo.actus',
  },
  android: {
    package: 'br.tec.somo.actus',
    adaptiveIcon: {
      backgroundColor: BG_LOWEST,
      foregroundImage: './assets/android-icon-foreground.png',
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
    [
      // Foto de perfil (onboarding aluno/professor): seleção da galeria. A string de
      // permissão é exigida no iOS; sem o plugin o dev client não compila o módulo nativo.
      'expo-image-picker',
      {
        photosPermission: 'O Actus usa suas fotos para definir a imagem de perfil.',
      },
    ],
    [
      // Backend de QA/dev é HTTP puro (http://136.119.240.96:3000). Android 9+ bloqueia
      // cleartext por padrão → request morre como "Sem conexão com o servidor". A flag
      // no topo de `android` é ignorada no SDK 55; o caminho suportado é este plugin.
      // Remover quando a API estiver atrás de HTTPS.
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
        },
      },
    ],
    'expo-font',
    'expo-audio',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png', // símbolo Actus neon (scripts/gen-brand-assets.mjs)
        backgroundColor: BG_LOWEST,
        imageWidth: 160,
      },
    ],
    '@react-native-community/datetimepicker',
    '@sentry/react-native',
    'react-native-edge-to-edge',
  ],
});
