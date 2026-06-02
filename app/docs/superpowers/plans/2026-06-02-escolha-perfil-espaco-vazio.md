# Tela de escolha de perfil — espaço vazio inferior — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver o espaço vazio inferior da tela de escolha de perfil transformando "Sou aluno" e "Sou professor" em dois cards-irmãos maiores (mesmo raio, com descrição) distribuídos no eixo vertical, sem alterar o hero.

**Architecture:** Mudança em um único arquivo de tela (`app/(auth)/escolha-perfil.tsx`). As duas escolhas, hoje componentes distintos (`PillAluno` pill + `OutlineProfessor` outline), são unificadas em um componente local `ChoiceCard` parametrizado por `variant` ('primary' | 'secondary'). A base escura usa espaçadores `flex: 1` para distribuir o conteúdo e ancorar o link "Entrar" no rodapé.

**Tech Stack:** React Native, Expo Router, Unistyles 3, Reanimated, Phosphor (CaretRight), expo-haptics. Tokens do theme em `src/theme/tokens.ts`.

**Nota sobre verificação:** Este projeto não tem test runner (ver `AGENTS.md` — só `typecheck` e `lint`). A verificação de cada passo é `npm run typecheck` + `npm run lint` e conferência visual no dev build contra os mockups aprovados. Não invente testes unitários para layout.

---

### Task 1: Unificar as escolhas em `ChoiceCard` e distribuir no eixo

**Files:**
- Modify (rewrite): `app/(auth)/escolha-perfil.tsx`

- [ ] **Step 1: Substituir o conteúdo completo do arquivo**

Substitua **todo** o conteúdo de `app/(auth)/escolha-perfil.tsx` por:

```tsx
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Logo } from '@/components/ui';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

export default function EscolhaPerfilScreen() {
  const router = useRouter();

  // ÚNICA animação da tela: o bloco neon desliza de cima no load.
  const blockY = useSharedValue(-40);
  const blockOpacity = useSharedValue(0);

  useEffect(() => {
    blockY.value = withTiming(0, { duration: motion.screenMs });
    blockOpacity.value = withTiming(1, { duration: motion.screenMs });
  }, [blockY, blockOpacity]);

  const blockStyle = useAnimatedStyle(() => ({
    opacity: blockOpacity.value,
    transform: [{ translateY: blockY.value }],
  }));

  function go(path: '/(auth)/cadastro' | '/(auth)/professor-info' | '/(auth)/login') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path);
  }

  return (
    <View style={styles.root}>
      {/* Bloco neon full-bleed — inalterado. Cobre a área da status bar (edges top). */}
      <Animated.View style={blockStyle}>
        <SafeAreaView edges={['top']} style={styles.neonBlock}>
          <View style={styles.neonInner}>
            <Logo variant="symbol" color="dark" width={44} />
            <AppText variant="h1" color="inverse" style={styles.manifesto}>
              O sistema por trás do movimento
            </AppText>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Base escura — escolhas distribuídas no eixo (B). */}
      <SafeAreaView edges={['bottom']} style={styles.base}>
        <View style={styles.baseInner}>
          <View style={styles.spacer} />

          <AppText variant="eyebrow" color="tertiary" style={styles.eyebrow}>
            Acesso
          </AppText>

          {/* As duas escolhas — cards-irmãos, mesmo raio. */}
          <ChoiceCard
            variant="primary"
            title="Sou aluno"
            description="Recebi um convite do meu treinador"
            accessibilityLabel="Sou aluno, com convite"
            onPress={() => go('/(auth)/cadastro')}
          />
          <ChoiceCard
            variant="secondary"
            title="Sou professor"
            description="Gerencio meus alunos"
            accessibilityLabel="Sou professor"
            onPress={() => go('/(auth)/professor-info')}
          />

          <View style={styles.spacer} />

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Já tenho conta. Entrar"
            onPress={() => go('/(auth)/login')}
            hitSlop={12}
            style={styles.entrarRow}
          >
            <AppText variant="bodyMd" color="secondary">
              Já tenho conta ·{' '}
            </AppText>
            <AppText variant="bodyMd" color="neon" style={styles.entrarLink}>
              Entrar
            </AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Card de escolha: título + descrição à esquerda, chevron à direita.
// variant 'primary' = fill neon · 'secondary' = outline. Mesmo raio (input/12).
type ChoiceCardProps = {
  variant: 'primary' | 'secondary';
  title: string;
  description: string;
  accessibilityLabel: string;
  onPress: () => void;
};

function ChoiceCard({
  variant,
  title,
  description,
  accessibilityLabel,
  onPress,
}: ChoiceCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={[styles.cardOuter, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.98, { duration: motion.microMs });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: motion.microMs });
        }}
        style={[styles.cardFill, isPrimary ? styles.cardPrimary : styles.cardSecondary]}
      >
        <View style={styles.cardText}>
          <AppText variant="label" color={isPrimary ? 'inverse' : 'primary'}>
            {title}
          </AppText>
          <AppText
            variant="bodySm"
            color={isPrimary ? 'inverse' : 'tertiary'}
            style={isPrimary ? styles.descPrimary : undefined}
          >
            {description}
          </AppText>
        </View>
        <CaretRight
          size={18}
          weight="duotone"
          color={isPrimary ? colors.textInverse : colors.textTertiary}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  neonBlock: {
    backgroundColor: theme.colors.neon,
  },
  neonInner: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  manifesto: {
    marginTop: theme.spacing.lg,
    fontSize: 38,
    lineHeight: Math.round(38 * 0.92),
  },
  base: {
    flex: 1,
  },
  baseInner: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  // Espaçadores que distribuem as escolhas no eixo (B) e ancoram "Entrar" no rodapé.
  spacer: {
    flex: 1,
  },
  eyebrow: {
    marginBottom: theme.spacing.lg,
    letterSpacing: 3,
  },
  // Card de escolha (par)
  cardOuter: {
    alignSelf: 'stretch',
    marginBottom: theme.spacing.md,
  },
  cardFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.radius.input,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  cardPrimary: {
    backgroundColor: theme.colors.neon,
  },
  cardSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  cardText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  // Descrição sobre fundo neon: texto inverse atenuado (opacity, não hex novo).
  descPrimary: {
    opacity: 0.6,
  },
  entrarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: theme.spacing.xl,
  },
  entrarLink: {
    fontFamily: theme.fontFamily.bodySemiBold,
  },
}));
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run typecheck`
Expected: PASS, sem erros. (Confirma que `ChoiceCardProps`, as variantes de `AppText` e os tokens usados existem.)

- [ ] **Step 3: Verificar lint**

Run: `npm run lint`
Expected: PASS. Sem imports não usados (os antigos `PillAluno`/`OutlineProfessor` foram removidos; `CaretRight` continua em uso).

- [ ] **Step 4: Conferência visual no dev build**

Run: `npm run start` e abra a tela de escolha de perfil no dev build.
Expected (contra os mockups aprovados):
- Hero neon idêntico ao anterior (animação de entrada mantida).
- "Sou aluno" (fill neon) e "Sou professor" (outline) com o **mesmo** raio (12px), mais altos, cada um com título + linha de descrição e um chevron à direita.
- Conteúdo distribuído no eixo: bloco "Acesso + cards" com respiro acima e abaixo; "Já tenho conta · Entrar" próximo ao rodapé. Sem grande vazio inferior.
- Press nos cards aplica scale 0.98 + haptic; navegação: aluno → cadastro, professor → professor-info, entrar → login.

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)/escolha-perfil.tsx"
git commit -m "feat(escolha-perfil): cards-irmãos maiores e distribuídos, resolve espaço vazio"
```

---

## Self-Review

- **Spec coverage:** Hero inalterado ✓ (neonBlock/manifesto intactos). Botões mesmo raio (input/12) ✓. Cards mais altos com descrição ✓ (paddingVertical xl + bodySm). Distribuição B ✓ (dois `spacer` flex:1). Pill/tag mono removidos ✓. Motion/haptics/a11y/navegação mantidos ✓. Tokens, sem hex hardcoded ✓ (opacity para atenuar descrição neon). Copy ajustável ✓.
- **Placeholder scan:** Nenhum TBD/TODO; código completo no passo.
- **Type consistency:** `ChoiceCardProps` define `variant`/`title`/`description`/`accessibilityLabel`/`onPress`; uso na tela bate. Variantes `AppText` (`label`, `bodySm`, `eyebrow`, `bodyMd`, `h1`) e cores (`inverse`/`primary`/`tertiary`/`neon`/`secondary`) existem em `Text.tsx`. Tokens `radius.input`, `spacing.*`, `colors.*`, `fontFamily.bodySemiBold` existem em `tokens.ts`.
