// Módulo de efeito colateral — importar UMA vez no entry point do app.
// Configura o react-native-unistyles v3 e tipa o tema globalmente.
import { StyleSheet } from 'react-native-unistyles';
import { darkTheme, type AppTheme } from './index';

// Breakpoints para o web (desktop vs mobile numa só árvore RN). No nativo o app
// segue mobile; na web permitem centralizar/expandir layouts (AppFrame, landing).
const breakpoints = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

type AppBreakpoints = typeof breakpoints;

StyleSheet.configure({
  themes: { dark: darkTheme },
  breakpoints,
  settings: { initialTheme: 'dark' },
});

declare module 'react-native-unistyles' {
  interface UnistylesThemes {
    dark: AppTheme;
  }
  interface UnistylesBreakpoints extends AppBreakpoints {}
}
