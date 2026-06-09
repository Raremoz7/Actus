// Cópia para a área de transferência resiliente a dev build sem o módulo nativo.
//
// O require é LAZY (dentro da função) de propósito: o `expo-clipboard` chama
// `requireNativeModule('ExpoClipboard')` no TOPO do módulo. Um import estático, portanto,
// executa esse require já na carga do arquivo — e como o expo-router carrega TODAS as
// rotas no boot, uma tela que importe clipboard derruba a árvore de rotas inteira quando
// o dev build não tem o módulo nativo compilado.
//
// Adiando o require para o momento do toque (e protegendo com try/catch), um módulo
// nativo ausente degrada para no-op (copiar não faz nada) em vez de brickar o app. Quando
// o dev build for reconstruído com o expo-clipboard, volta a copiar normalmente.
//
// require síncrono (e não `await import`) de propósito: o handler precisa chamar
// setStringAsync de forma síncrona; o require continua lazy mesmo assim.
export async function copyText(text: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Clipboard = require('expo-clipboard') as typeof import('expo-clipboard');
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
