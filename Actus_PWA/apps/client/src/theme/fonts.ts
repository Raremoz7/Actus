// Fontes do design system agora são BUNDLADAS no binário (assets/fonts/*.ttf,
// linkadas via react-native.config.js + npx react-native-asset). No Android o
// fontFamily resolve pelo NOME DO ARQUIVO — por isso os .ttf têm exatamente os
// nomes das famílias usadas nos tokens (BarlowCondensed_800ExtraBold etc.).
// Fontes bundladas carregam sincronamente: o hook existe só para manter o
// contrato dos consumidores (splash espera fontsLoaded).
export function useAppFonts(): boolean {
  return true;
}
