# Fase 0 — Spike de validação (RESULTADO: ✅ APROVADO)

Objetivo: provar que um codebase **React Native rodando na web via react-native-web + Vite (sem Expo)** aguenta as libs críticas do app Actus. Gate técnico antes das fases 1+.

## O que foi validado

| Item | Status | Evidência |
|---|---|---|
| RN → DOM via Vite + react-native-web | ✅ | `SpikeScreen` (árvore `View`/`Text`/`Pressable`) renderiza no `#root` |
| Plugin Babel do **Unistyles 3** | ✅ | módulo servido contém marcadores do plugin; tema aplicado (botão neon = `rgb(203,254,0)` = `#CBFE00`) |
| **Breakpoints** responsivos (Unistyles) | ✅ | grid vira linha no desktop (cartões lado a lado em ≥`md`) via **CSS media queries** |
| Plugin Babel do **Reanimated 4** (worklets) | ✅ | `"worklet"` vira factory com `__workletHash`; runtime `_WORKLET` inicializa; valor inicial `scale(1)` aplicado por `useAnimatedStyle` |
| **react-native-svg** | ✅ | 4 `<svg>` no DOM (1 vetor custom + 3 ícones) |
| **phosphor-react-native** | ✅ | ícones duotone renderizam (via svg) |
| **gesture-handler** | ✅ | `GestureDetector` monta sem crash |
| **Build de produção** (Rollup) | ✅ | `vite build`: 3952 módulos, 776 KB (231 KB gzip), sem erros |

## Achado crítico (baked na config)

> **Vite 8 + `@vitejs/plugin-react` v6 NÃO serve.** A v6 (linha Rolldown/Vite 8) transforma com **oxc** e **removeu a opção `babel`** — plugins Babel customizados são **silenciosamente ignorados**. Como Unistyles 3 e Reanimated 4 **exigem** plugin Babel, é obrigatório usar **`@vitejs/plugin-react` v4 + Vite 6**, que mantém o pipeline Babel. (Sintoma: `[Reanimated] useAnimatedStyle was used without ... Babel plugin`.)

Config final em [`apps/client/vite.config.ts`](../apps/client/vite.config.ts): plugins Babel `react-native-unistyles/plugin` (root `src`) + `react-native-worklets/plugin` (por último), alias `react-native$ → react-native-web`, resolução `.web.*`, defines de `__DEV__`/`global`/`process.env.NODE_ENV`.

## Ressalvas (não bloqueiam)

1. **Animação contínua não observável no preview headless.** A aba do preview roda `hidden` (`document.visibilityState === 'hidden'`), então o navegador estrangula `requestAnimationFrame` — e o Reanimated web é dirigido por rAF. O worklet compila, o runtime inicializa e o valor inicial é aplicado; a animação em si **precisa ser confirmada numa aba visível** (abrir `http://localhost:5173` no navegador). Mesma causa do `preview_screenshot` travar.
2. **`rt.screen.width` lê 0px no primeiro frame** (quirk do Dimensions do react-native-web em JS). Não afeta layout responsivo, que vem das media queries CSS do Unistyles. Preferir breakpoints do Unistyles a leituras de `Dimensions` em JS.

## Versões travadas (apps/client)

- react / react-dom **19.2**
- react-native-web **0.21.2**
- vite **6.4.3** · @vitejs/plugin-react **4.7.0** ← (NÃO subir para v8/v6)
- react-native-unistyles **3.2.5**
- react-native-reanimated **4.5.1** · react-native-worklets **0.10.2**
- react-native-gesture-handler **3.0.2** · react-native-svg **15.15.5** · phosphor-react-native **3.0.6**
