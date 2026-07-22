// Entry point real do app (referenciado em package.json "main").
// MOTIVO: o Unistyles 3 exige que StyleSheet.configure rode ANTES de qualquer
// StyleSheet.create — a configuração precisa acontecer aqui, antes de qualquer tela.
import './src/theme/unistyles';

import { AppRegistry } from 'react-native';

import App from './src/App';

AppRegistry.registerComponent('Actus', () => App);
