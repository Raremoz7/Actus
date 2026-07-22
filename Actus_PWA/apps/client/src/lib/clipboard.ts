// Cópia para a área de transferência resiliente a dev build sem o módulo nativo.
//
// O require é LAZY (dentro da função) de propósito: um import estático executa o
// require do módulo nativo já na carga do arquivo — se o binário não tiver o
// módulo compilado, a tela que importa clipboard derrubaria a árvore no boot.
// Adiando o require para o momento do toque (com try/catch), módulo ausente
// degrada para no-op (copiar não faz nada) em vez de brickar o app.
export async function copyText(text: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Clipboard = (
      require('@react-native-clipboard/clipboard') as {
        default: { setString: (t: string) => void };
      }
    ).default;
    Clipboard.setString(text);
    return true;
  } catch {
    return false;
  }
}
