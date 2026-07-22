// API pública de navegação do app. Os arquivos que antes importavam de
// 'expo-router' importam daqui — mesma assinatura (router, useRouter,
// useLocalSearchParams, Redirect, Href).
export { router, useRouter, useLocalSearchParams, Redirect, navigationRef, type Href } from './router';
export { RootNavigator, STACK_BG } from './navigators';
export { resolveHref, toNavigateArgs } from './routes';
