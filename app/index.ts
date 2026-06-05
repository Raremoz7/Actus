// Entry point real do app (referenciado em package.json "main").
// MOTIVO: o Unistyles 3 exige que StyleSheet.configure rode ANTES de qualquer
// StyleSheet.create — com Expo Router, as rotas em app/ podem ser avaliadas antes
// do _layout.tsx, então a configuração precisa acontecer aqui, antes do router.
// Ref: https://www.unistyl.es/v3/guides/expo-router
import './src/theme/unistyles';
import 'expo-router/entry';
