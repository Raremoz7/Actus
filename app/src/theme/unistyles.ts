// Módulo de efeito colateral — importar UMA vez no entry point do app.
// Configura o react-native-unistyles v3 e tipa o tema globalmente.
import { StyleSheet } from 'react-native-unistyles';
import { darkTheme, type AppTheme } from './index';

StyleSheet.configure({
  themes: { dark: darkTheme },
  settings: { initialTheme: 'dark' },
});

declare module 'react-native-unistyles' {
  interface UnistylesThemes {
    dark: AppTheme;
  }
}
