# Bottom menu (ActusTabBar) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover o botão central (FAB) da tab bar e dar à aba ativa um sublinhado neon que desliza ao trocar de aba, aplicando a mudança às três áreas (aluno, personal, nutri).

**Architecture:** A `ActusTabBar` é o componente único usado pelas 3 áreas. Removemos todo o suporte a `center` (código morto) e adicionamos um sublinhado animado posicionado por uma função pura `underlineTranslateX` (testável sem render). A animação usa Reanimated (`withTiming`), com a posição derivada da largura medida via `onLayout`.

**Tech Stack:** React Native · Expo Router · `@react-navigation/bottom-tabs` · Reanimated · Unistyles 3 · Phosphor duotone · Jest + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-06-05-bottom-menu-design.md`

---

## Estrutura de arquivos

- **Modificar** `jest.setup.js` — adicionar `Easing` ao mock do reanimated e `selectionAsync` ao mock do `expo-haptics` (o componente os usa).
- **Criar** `src/components/navigation/underline.ts` — função pura `underlineTranslateX` (posição do sublinhado).
- **Criar** `src/components/navigation/underline.test.ts` — testes da função pura.
- **Reescrever** `src/components/navigation/ActusTabBar.tsx` — remover `center`, adicionar sublinhado deslizante.
- **Criar** `src/components/navigation/ActusTabBar.test.tsx` — testes de comportamento (labels, navegação, haptic).
- **Modificar** `app/(aluno)/(tabs)/_layout.tsx` — remover a prop `center` e o import `PlayIcon`.
- `app/(personal)/(tabs)/_layout.tsx` e `app/(nutri)/(tabs)/_layout.tsx` — **sem alteração** (já não passam `center`; herdam o sublinhado).

Nota sobre TDD: a única unidade com lógica pura é `underlineTranslateX` (Task 2, TDD clássico). A reescrita do componente (Task 3) é refactor + feature visual não-asserível por unidade (depende de layout/animação); cobrimos com um **teste de caracterização** que trava o comportamento visível (labels, navegação, haptic) ao longo do refactor.

---

### Task 1: Mocks de teste (Easing + selectionAsync)

**Files:**
- Modify: `jest.setup.js`

- [ ] **Step 1: Adicionar `selectionAsync` ao mock do expo-haptics**

Localize o bloco `jest.mock('expo-haptics', ...)` e substitua-o por:

```js
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));
```

- [ ] **Step 2: Adicionar `Easing` ao mock do reanimated**

No `jest.mock('react-native-reanimated', ...)`, dentro do objeto retornado (o `return { __esModule: true, default: Animated, ... }`), acrescente a chave `Easing` logo após `withTiming`:

```js
    Easing: {
      bezier: () => (t) => t,
      linear: (t) => t,
      out: (fn) => fn,
      inOut: (fn) => fn,
      cubic: (t) => t,
    },
```

- [ ] **Step 3: Rodar a suíte atual para garantir que nada quebrou**

Run: `npx jest --silent`
Expected: PASS (mesmos testes de antes; os mocks novos são aditivos).

- [ ] **Step 4: Commit**

```bash
git add jest.setup.js
git commit -m "test(setup): mock Easing (reanimated) e selectionAsync (haptics)"
```

---

### Task 2: Função pura `underlineTranslateX`

**Files:**
- Create: `src/components/navigation/underline.ts`
- Test: `src/components/navigation/underline.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Crie `src/components/navigation/underline.test.ts`:

```ts
import { underlineTranslateX } from './underline';

describe('underlineTranslateX', () => {
  it('centraliza sob a 1ª aba (4 abas)', () => {
    // tabWidth = 100; 0*100 + (100-30)/2 = 35
    expect(underlineTranslateX(0, 400, 4, 30)).toBe(35);
  });

  it('centraliza sob a última aba (4 abas)', () => {
    // 3*100 + 35 = 335
    expect(underlineTranslateX(3, 400, 4, 30)).toBe(335);
  });

  it('funciona com 3 abas (nutri)', () => {
    // tabWidth = 120; 1*120 + (120-30)/2 = 165
    expect(underlineTranslateX(1, 360, 3, 30)).toBe(165);
  });

  it('barWidth ainda não medido (0) retorna 0', () => {
    expect(underlineTranslateX(0, 0, 4, 30)).toBe(0);
  });

  it('tabCount 0 retorna 0 (degenerado)', () => {
    expect(underlineTranslateX(0, 400, 0, 30)).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx jest src/components/navigation/underline.test.ts`
Expected: FAIL — "Cannot find module './underline'".

- [ ] **Step 3: Implementar a função mínima**

Crie `src/components/navigation/underline.ts`:

```ts
// Posição X (px, a partir da esquerda da barra) do sublinhado neon sob a aba
// ativa, centralizado dentro da coluna da aba. Pura → testável sem render.
export function underlineTranslateX(
  activeIndex: number,
  barWidth: number,
  tabCount: number,
  underlineWidth: number,
): number {
  if (barWidth <= 0 || tabCount <= 0) return 0;
  const tabWidth = barWidth / tabCount;
  return activeIndex * tabWidth + (tabWidth - underlineWidth) / 2;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx jest src/components/navigation/underline.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add src/components/navigation/underline.ts src/components/navigation/underline.test.ts
git commit -m "feat(tabbar): underlineTranslateX (posição do sublinhado ativo)"
```

---

### Task 3: Reescrever `ActusTabBar` (remover center + sublinhado deslizante)

**Files:**
- Modify: `src/components/navigation/ActusTabBar.tsx` (reescrita completa)
- Test: `src/components/navigation/ActusTabBar.test.tsx`

- [ ] **Step 1: Escrever o teste de caracterização**

Crie `src/components/navigation/ActusTabBar.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { HouseIcon } from 'phosphor-react-native';
import { ActusTabBar, type TabSpec } from './ActusTabBar';

const TABS: readonly TabSpec[] = [
  { name: 'index', label: 'HOJE', renderIcon: (c) => <HouseIcon color={c} /> },
  { name: 'treinos', label: 'TREINOS', renderIcon: (c) => <HouseIcon color={c} /> },
];

function makeProps(index: number) {
  const routes = TABS.map((t, i) => ({ key: `${t.name}-${i}`, name: t.name }));
  return {
    state: { index, routes, key: 'tab', routeNames: TABS.map((t) => t.name) },
    navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() },
    descriptors: {},
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  };
}

describe('ActusTabBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza os labels de todas as abas', () => {
    render(<ActusTabBar {...(makeProps(0) as never)} tabs={TABS} />);
    expect(screen.getByText('HOJE')).toBeTruthy();
    expect(screen.getByText('TREINOS')).toBeTruthy();
  });

  it('toque em aba não-ativa navega e dispara haptic', () => {
    const props = makeProps(0);
    render(<ActusTabBar {...(props as never)} tabs={TABS} />);
    fireEvent.press(screen.getByLabelText('TREINOS'));
    expect(props.navigation.navigate).toHaveBeenCalledWith('treinos');
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });

  it('toque na aba ativa não navega', () => {
    const props = makeProps(0);
    render(<ActusTabBar {...(props as never)} tabs={TABS} />);
    fireEvent.press(screen.getByLabelText('HOJE'));
    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que passa contra o componente atual**

Run: `npx jest src/components/navigation/ActusTabBar.test.tsx`
Expected: PASS (3 testes). É um teste de caracterização — trava o comportamento que deve sobreviver ao refactor.

- [ ] **Step 3: Reescrever o componente**

Substitua TODO o conteúdo de `src/components/navigation/ActusTabBar.tsx` por:

```tsx
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';
import { underlineTranslateX } from './underline';

// Descrição de cada aba: rótulo (mono UPPERCASE) + ícone que recebe a cor (ativo/inativo).
export type TabSpec = {
  name: string;
  label: string;
  renderIcon: (color: string) => ReactNode;
};

type ActusTabBarProps = BottomTabBarProps & {
  tabs: readonly TabSpec[];
};

const { colors, motion } = darkTheme;

// Sublinhado neon: largura fixa e duração do deslize (a única animação da barra).
const UNDERLINE_WIDTH = 30;
const SLIDE_MS = 200;

export function ActusTabBar({ state, navigation, tabs }: ActusTabBarProps) {
  const insets = useSafeAreaInsets();

  // Mapa rota→spec para casar a ordem real do navigator com a config declarada.
  const specByName = new Map(tabs.map((t) => [t.name, t]));

  const [barWidth, setBarWidth] = useState(0);
  const tx = useSharedValue(0);
  const firstRef = useRef(true);

  // Move o sublinhado para a aba ativa. Na 1ª medição posiciona direto (sem
  // deslizar do canto); nas trocas seguintes anima com withTiming.
  useEffect(() => {
    if (barWidth <= 0) return;
    const target = underlineTranslateX(
      state.index,
      barWidth,
      state.routes.length,
      UNDERLINE_WIDTH,
    );
    if (firstRef.current) {
      tx.value = target;
      firstRef.current = false;
    } else {
      tx.value = withTiming(target, {
        duration: SLIDE_MS,
        easing: Easing.bezier(
          motion.easing[0],
          motion.easing[1],
          motion.easing[2],
          motion.easing[3],
        ),
      });
    }
  }, [state.index, barWidth, state.routes.length, tx]);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  function handlePress(routeName: string, routeKey: string, focused: boolean) {
    void Haptics.selectionAsync();
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  }

  function onRowLayout(e: LayoutChangeEvent) {
    setBarWidth(e.nativeEvent.layout.width);
  }

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      <View style={styles.row} onLayout={onRowLayout}>
        {state.routes.map((route, index) => {
          const spec = specByName.get(route.name);
          // Rotas sem spec (não deveriam existir) são puladas silenciosamente.
          if (!spec) return null;
          const focused = state.index === index;
          const color = focused ? colors.neon : colors.textTertiary;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={spec.label}
              onPress={() => handlePress(route.name, route.key, focused)}
              style={styles.tab}
            >
              {spec.renderIcon(color)}
              <AppText
                variant="eyebrow"
                color={focused ? 'neon' : 'tertiary'}
                numberOfLines={1}
                style={styles.label}
              >
                {spec.label}
              </AppText>
            </Pressable>
          );
        })}

        {barWidth > 0 ? (
          <Animated.View style={[styles.underline, underlineStyle]} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    backgroundColor: theme.colors.surface1,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  // Linha de conteúdo medida (largura) e âncora do sublinhado absoluto.
  row: {
    flexDirection: 'row',
    position: 'relative',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  label: { marginTop: 2 },
  // Sublinhado neon: acima da área segura (paddingBottom da barra fica por fora).
  underline: {
    position: 'absolute',
    left: 0,
    bottom: theme.spacing.xs,
    width: UNDERLINE_WIDTH,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.neon,
  },
}));
```

- [ ] **Step 4: Rodar os testes do componente e da função pura**

Run: `npx jest src/components/navigation`
Expected: PASS (caracterização 3/3 + função pura 5/5). O comportamento visível sobreviveu ao refactor.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: sem erros (o tipo `CenterAction` e a prop `center` deixaram de existir; nenhum outro arquivo os importa além do layout do aluno, ajustado na Task 4).
Nota: se o typecheck acusar `center`/`CenterAction` em algum lugar inesperado, rode `grep -rn "CenterAction\|center=" src app` e ajuste — só o layout do aluno deveria aparecer (Task 4).

- [ ] **Step 6: Commit**

```bash
git add src/components/navigation/ActusTabBar.tsx src/components/navigation/ActusTabBar.test.tsx
git commit -m "feat(tabbar): remove FAB central e adiciona sublinhado neon deslizante"
```

---

### Task 4: Ajustar o layout do aluno (remover center + PlayIcon)

**Files:**
- Modify: `app/(aluno)/(tabs)/_layout.tsx`

- [ ] **Step 1: Substituir o conteúdo do arquivo**

Substitua TODO o conteúdo de `app/(aluno)/(tabs)/_layout.tsx` por:

```tsx
import { HouseIcon, BarbellIcon, TrophyIcon, UserIcon } from 'phosphor-react-native';
import { Tabs } from 'expo-router';

import { ActusTabBar, type TabSpec } from '@/components/navigation/ActusTabBar';

const ICON_SIZE = 24;

// Abas do aluno na ordem em que aparecem na barra.
const TABS: readonly TabSpec[] = [
  {
    name: 'index',
    label: 'HOJE',
    renderIcon: (color) => <HouseIcon size={ICON_SIZE} color={color} weight="duotone" />,
  },
  {
    name: 'treinos',
    label: 'TREINOS',
    renderIcon: (color) => <BarbellIcon size={ICON_SIZE} color={color} weight="duotone" />,
  },
  {
    name: 'desafios',
    label: 'DESAFIOS',
    renderIcon: (color) => <TrophyIcon size={ICON_SIZE} color={color} weight="duotone" />,
  },
  {
    name: 'perfil',
    label: 'PERFIL',
    renderIcon: (color) => <UserIcon size={ICON_SIZE} color={color} weight="duotone" />,
  },
];

export default function AlunoTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ActusTabBar {...props} tabs={TABS} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="treinos" />
      <Tabs.Screen name="desafios" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: sem erros (sumiu o uso de `center` e o import `PlayIcon`).

- [ ] **Step 3: Commit**

```bash
git add "app/(aluno)/(tabs)/_layout.tsx"
git commit -m "feat(aluno): remove botão central da tab bar"
```

---

### Task 5: Verificação final

**Files:** nenhuma alteração (só validação).

- [ ] **Step 1: Garantir que não sobrou referência ao center**

Run: `grep -rn "CenterAction\|center=" src app` (ou `Select-String` no PowerShell)
Expected: nenhuma ocorrência.

- [ ] **Step 2: Suíte completa de testes**

Run: `npx jest --silent`
Expected: PASS (todos, incluindo os novos da navegação).

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: ambos limpos (0 erros, 0 warnings).

- [ ] **Step 4: Validação visual no app (manual)**

Suba o app (web já em uso nesta sessão, ou dev build) e confira na área do aluno:
- Não há botão central; 4 abas dividem a largura.
- Aba ativa: ícone+label neon + sublinhado neon centralizado, acima do indicador de home.
- Ao trocar de aba o sublinhado desliza (~200ms) até a nova posição; ao abrir, já aparece sob a aba ativa (sem deslizar do canto).
- Nutri (3 abas) e personal (4 abas) também mostram o sublinhado.

Nenhum commit neste passo (validação).

---

## Self-review

- **Cobertura do spec:** remover FAB + suporte a `center` (Task 3 reescrita + Task 4 layout) ✓; estado ativo neon + sublinhado (Task 3 estilos) ✓; movimento deslizante ~200ms via Reanimated com posição da função pura (Task 2 + Task 3 effect) ✓; sublinhado acima da área segura (`paddingBottom: insets.bottom` no `bar`, underline ancorado no `row`) ✓; vale para as 3 áreas (componente compartilhado; personal/nutri sem alteração) ✓; mantém labels mono sempre visíveis, ícones duotone, haptic, sem sombra, tokens ✓; função pura testável `underlineTranslateX` (Task 2) ✓; testes do componente e da função (Task 2, Task 3) ✓; typecheck/lint/suite limpos (Task 5) ✓.
- **Placeholders:** nenhum — todo passo traz o código/comando real.
- **Consistência de tipos/nomes:** `underlineTranslateX(activeIndex, barWidth, tabCount, underlineWidth)` definida na Task 2 e chamada idêntica na Task 3; `UNDERLINE_WIDTH`/`SLIDE_MS` definidos e usados no mesmo arquivo; `TabSpec` exportado e reusado no layout do aluno e no teste.
