# Bottom menu (tab bar) — refino de design

**Data:** 2026-06-05 · **Status:** validado com o designer (Davi) · **Branch:** `branch/davi`

## Contexto

A `ActusTabBar` (`src/components/navigation/ActusTabBar.tsx`) é a barra de
navegação inferior compartilhada pelas três áreas:

- **Aluno:** HOJE · TREINOS · DESAFIOS · PERFIL (4 abas) + **botão central neon
  (FAB)** com ação "iniciar treino do dia".
- **Personal:** ALUNOS · TREINOS · DESAFIOS · PERFIL (4 abas, sem FAB).
- **Nutri:** ALUNOS · DIETAS · PERFIL (3 abas, sem FAB).

O FAB central do aluno está **sem função** (`onPress` é um `TODO`), só o aluno o
usa, e ele duplica o CTA "iniciar treino" que já existe no card da Home. O estado
ativo hoje é só troca de cor (neon). O design da barra nunca foi refinado/validado.

## Decisões (validadas)

Direção escolhida: **A — Editorial minimal**.

1. **Remover o botão central (FAB)** de vez, incluindo **todo o suporte a `center`**
   no componente (tipo `CenterAction`, prop `center`, slot e estilos). Vira código
   morto após a remoção — só o aluno usava, e em no-op. Iniciar treino continua
   acessível pelo card "treino de hoje" da Home.
2. **Estado ativo:** ícone + label em **neon**; inativo em **textTertiary** (como
   hoje). Acrescentar um **sublinhado neon** abaixo do label.
3. **Movimento (assinatura da barra):** o sublinhado **desliza** horizontalmente
   até a aba ativa ao trocar de aba (~200ms, easing de saída). É a única animação
   da barra.
4. Aplicar a **todas as três áreas** (mesmo componente). Personal e nutri já eram
   sem FAB — só ganham o sublinhado deslizante.

### Mantido (sem mudança)

- Labels mono UPPERCASE (`variant="eyebrow"`) **sempre visíveis** em todas as abas.
- Ícones **Phosphor duotone**, tamanho 24.
- **Haptic** (`Haptics.selectionAsync`) no toque de aba.
- **Sem sombra/glow**. Fundo `surface1`, borda-topo 1px `outlineVariant`.
- Tudo via tokens do theme — nenhum hex hardcoded em componente.

## Especificação visual

### Layout da barra

- Container `bar`: `flexDirection: row`, `backgroundColor: surface1`,
  `borderTopWidth: 1`, `borderTopColor: outlineVariant`.
- **Safe area:** `paddingBottom: insets.bottom` no container externo. O conteúdo
  das abas (ícone+label) e o sublinhado ficam numa **linha de conteúdo** ACIMA
  desse padding — o sublinhado nunca invade a área do indicador de home do iPhone.
- Cada aba: coluna `flex: 1`, `alignItems: center`, ícone + label, `gap: xs`.
  Para 3 abas (nutri) ou 4 (aluno/personal) o `flex: 1` divide igualmente.

### Sublinhado (indicador ativo)

- **Largura:** 30px · **Altura:** 3px · **Raio:** 2px · **Cor:** `neon`.
- Posicionado **absoluto** dentro da linha de conteúdo, `bottom: 0` (logo abaixo
  dos labels), centralizado horizontalmente sob a aba ativa.
- Visível apenas após a barra ser medida (evita "pulo" do canto na montagem).

### Movimento

- Reanimated. Um `useSharedValue` para o `translateX` do sublinhado.
- Largura da barra obtida por `onLayout` da linha de conteúdo.
- **Posição alvo** (função pura, testável):

  ```
  tabWidth   = barWidth / tabCount
  translateX = activeIndex * tabWidth + (tabWidth - underlineWidth) / 2
  ```

- **Primeira medição:** define `translateX` direto (sem animar) — o sublinhado
  aparece já sob a aba ativa.
- **Troca de aba:** anima `translateX` com `withTiming(target, { duration: ~200ms,
  easing: Easing.out(Easing.cubic) })`.
- Funciona para 3 e 4 abas sem ramificação especial.

## Arquitetura / componentes

### `src/components/navigation/ActusTabBar.tsx` (reescrita focada)

**Remover:**

- Tipo `CenterAction`, prop `center`, `centerSlot`, `renderCenter`,
  `handleCenterPress`, estilos `centerSlot`/`centerButton`.
- Import de `Fragment` (não há mais injeção de coluna central).

**Adicionar:**

- Medição de largura via `onLayout` na linha de conteúdo (estado local
  `barWidth`).
- `useSharedValue` + `useAnimatedStyle` para o `translateX` do sublinhado.
- `useEffect` reagindo a `state.index` e `barWidth`: primeira medição seta direto;
  trocas subsequentes animam com `withTiming`.
- Elemento `Animated.View` do sublinhado (estilo `underline` + estilo animado).

**Manter:** `handlePress` (haptic + `tabPress` + `navigate`), `renderTab`
(ícone + label, cor por foco), mapa `specByName`.

### Função pura (isolamento + testabilidade)

Extrair para um helper testável (mesmo arquivo ou `src/lib`):

```ts
export function underlineTranslateX(
  activeIndex: number,
  barWidth: number,
  tabCount: number,
  underlineWidth: number,
): number
```

Permite testar a matemática do indicador sem renderizar/animar.

### `app/(aluno)/(tabs)/_layout.tsx`

- Remover a prop `center={...}` passada para `ActusTabBar`.
- Remover o import `PlayIcon` (não mais usado).

### `app/(personal)/(tabs)/_layout.tsx` e `app/(nutri)/(tabs)/_layout.tsx`

- **Sem mudança** (já não passam `center`). Herdam o sublinhado deslizante.

## Testes

- **Unit (função pura):** `underlineTranslateX` — centraliza para 3 e 4 abas;
  índice 0 e último; `barWidth = 0` retorna 0 (degenerado).
- **Componente (`ActusTabBar`):** renderiza N abas; aba focada usa cor neon no
  ícone/label; toque emite `tabPress` e navega; haptic chamado. (Animação não é
  asserida — só o estado estático.)
- Garantir que os testes existentes da barra continuem passando após a remoção do
  `center`.

## Fora de escopo

- Reintroduzir qualquer atalho de "iniciar treino" fora do card da Home.
- Mudar ordem das abas, labels ou escolha de ícones.
- Mudanças nos headers das telas ou em qualquer conteúdo acima da barra.

## Critérios de aceite

- Nenhuma das 3 áreas mostra botão central; o componente não tem mais suporte a
  `center`.
- Aba ativa tem ícone+label neon + sublinhado neon (3px) centralizado.
- Ao trocar de aba, o sublinhado desliza (~200ms) até a nova posição; na montagem
  já aparece sob a aba ativa, sem deslizar do canto.
- Sublinhado fica acima da área segura (não toca o indicador de home).
- `npm run typecheck` e `npm run lint` limpos; testes da barra passando.
