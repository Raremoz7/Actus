# Exercise Hero Carousel + Lightbox — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar carrossel deslizável entre 2 imagens no hero da tela de exercício, com lightbox fullscreen ao tocar.

**Architecture:** Dois novos componentes em `app/src/components/exercises/` — `HeroCarousel` (carrossel com PanGesture + dots) e `ImageLightbox` (Modal + PanGesture). A tela `[id].tsx` monta o array `heroImages` e passa para esses componentes, mantendo o visual cinematográfico intacto.

**Tech Stack:** React Native, Expo SDK 55, react-native-reanimated 3.x (já instalado), react-native-gesture-handler 2.x (já instalado + GestureHandlerRootView configurado em `_layout.tsx`), Unistyles 3, darkTheme tokens.

---

### Arquivos

| Ação | Caminho |
|---|---|
| Criar | `app/src/components/exercises/HeroCarousel.tsx` |
| Criar | `app/src/components/exercises/ImageLightbox.tsx` |
| Modificar | `app/app/(aluno)/exercicio/[id].tsx` |

---

### Task 1: HeroCarousel

**Files:**
- Create: `app/src/components/exercises/HeroCarousel.tsx`

- [ ] **Step 1: Criar o arquivo com o componente**

```tsx
// app/src/components/exercises/HeroCarousel.tsx
import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { darkTheme } from '@/theme';

interface HeroCarouselProps {
  images: ImageSourcePropType[];
  height: number;
  onTap?: (index: number) => void;
  children?: ReactNode;
}

export function HeroCarousel({ images, height, onTap, children }: HeroCarouselProps) {
  const { width } = useWindowDimensions();
  const hasTwo = images.length >= 2;

  // translateX anima o row: 0 = página 0, -width = página 1
  const translateX = useSharedValue(0);
  const page = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      if (!hasTwo) return;
      translateX.value = -page.value * width + e.translationX;
    })
    .onEnd((e) => {
      if (!hasTwo) return;
      const shouldAdvance =
        Math.abs(e.translationX) > width * 0.3 || Math.abs(e.velocityX) > 400;
      const dir = e.translationX < 0 ? 1 : -1;
      const target = shouldAdvance
        ? Math.max(0, Math.min(1, page.value + dir))
        : page.value;
      page.value = target;
      translateX.value = withSpring(-target * width, { damping: 22, stiffness: 200 });
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Dot 0 = opaco quando página 0, translúcido quando página 1 (e vice-versa).
  const dot0Style = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-width, 0], [0.35, 1], 'clamp'),
  }));
  const dot1Style = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-width, 0], [1, 0.35], 'clamp'),
  }));

  function handlePress() {
    onTap?.(page.value);
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Pressable
        style={{ height, overflow: 'hidden' }}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Ampliar imagem"
      >
        {/* Row de imagens — translateX move entre páginas */}
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              width: width * Math.max(images.length, 1),
              height,
            },
            rowStyle,
          ]}
        >
          {images.map((src, i) => (
            <Image
              key={i}
              accessible={false}
              source={src}
              resizeMode="cover"
              style={{ width, height }}
            />
          ))}
        </Animated.View>

        {/* Conteúdo sobreposto (gradient, botão voltar, título) */}
        {children}

        {/* Dots — só com 2 imagens */}
        {hasTwo && (
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, dot0Style]} />
            <Animated.View style={[styles.dot, dot1Style]} />
          </View>
        )}
      </Pressable>
    </GestureDetector>
  );
}

const { colors, spacing, radius } = darkTheme;

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.neon,
  },
});
```

- [ ] **Step 2: Verificar typecheck parcial**

```bash
cd /mnt/h/Actus/app && npx tsc --noEmit --skipLibCheck 2>&1 | grep "HeroCarousel" | head -20
```

Esperado: sem erros relacionados a `HeroCarousel.tsx`.

---

### Task 2: ImageLightbox

**Files:**
- Create: `app/src/components/exercises/ImageLightbox.tsx`

- [ ] **Step 1: Criar o arquivo com o componente**

```tsx
// app/src/components/exercises/ImageLightbox.tsx
import { useEffect } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { X } from 'phosphor-react-native';
import { darkTheme } from '@/theme';

interface ImageLightboxProps {
  images: ImageSourcePropType[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, visible, onClose }: ImageLightboxProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = darkTheme;

  const translateX = useSharedValue(-initialIndex * width);
  const page = useSharedValue(initialIndex);

  // Reinicia a posição toda vez que o lightbox abre
  useEffect(() => {
    if (visible) {
      page.value = initialIndex;
      translateX.value = -initialIndex * width;
    }
  }, [visible, initialIndex, width]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = -page.value * width + e.translationX;
    })
    .onEnd((e) => {
      // Swipe para baixo com velocidade alta → fechar
      if (e.velocityY > 600 && Math.abs(e.velocityY) > Math.abs(e.velocityX)) {
        runOnJS(onClose)();
        return;
      }
      // Troca de página horizontal
      const shouldAdvance =
        images.length > 1 &&
        (Math.abs(e.translationX) > width * 0.3 || Math.abs(e.velocityX) > 400);
      const dir = e.translationX < 0 ? 1 : -1;
      const target = shouldAdvance
        ? Math.max(0, Math.min(images.length - 1, page.value + dir))
        : page.value;
      page.value = target;
      translateX.value = withSpring(-target * width, { damping: 22, stiffness: 200 });
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const dot0Style = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-width, 0], [0.35, 1], 'clamp'),
  }));
  const dot1Style = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-width, 0], [1, 0.35], 'clamp'),
  }));

  const imgHeight = Math.min(width, height * 0.75);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop: toque fora fecha */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
      >
        {/* Área da imagem: toque NÃO fecha (stopPropagation via Pressable filho) */}
        <GestureDetector gesture={panGesture}>
          <Pressable
            style={{ justifyContent: 'center', overflow: 'hidden', width }}
            onPress={() => {/* absorve o tap para não fechar */}}
          >
            <Animated.View
              style={[{ flexDirection: 'row', width: width * images.length }, rowStyle]}
            >
              {images.map((src, i) => (
                <Image
                  key={i}
                  accessible={false}
                  source={src}
                  resizeMode="contain"
                  style={{ width, height: imgHeight }}
                />
              ))}
            </Animated.View>
          </Pressable>
        </GestureDetector>

        {/* Dots */}
        {images.length >= 2 && (
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, dot0Style]} />
            <Animated.View style={[styles.dot, dot1Style]} />
          </View>
        )}
      </Pressable>

      {/* Botão fechar — fora do backdrop Pressable para não propagar */}
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        hitSlop={12}
        style={[
          styles.closeBtn,
          { top: insets.top + spacing.md, right: spacing.lg },
        ]}
      >
        <X size={22} weight="bold" color={colors.textPrimary} />
      </Pressable>
    </Modal>
  );
}

const { colors, spacing, radius } = darkTheme;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginTop: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.neon,
  },
});
```

- [ ] **Step 2: Verificar typecheck parcial**

```bash
cd /mnt/h/Actus/app && npx tsc --noEmit --skipLibCheck 2>&1 | grep "ImageLightbox" | head -20
```

Esperado: sem erros.

---

### Task 3: Integrar em `[id].tsx`

**Files:**
- Modify: `app/app/(aluno)/exercicio/[id].tsx`

- [ ] **Step 1: Adicionar imports e estado do lightbox**

No topo do arquivo, adicionar os dois imports novos e o import de `useState`:

```tsx
import { useState } from 'react';
// (os outros imports existentes permanecem)
import { HeroCarousel } from '@/components/exercises/HeroCarousel';
import { ImageLightbox } from '@/components/exercises/ImageLightbox';
```

`useState` já pode ser importado junto com o `useEffect` existente — checar se já está no import do `react`.

- [ ] **Step 2: Montar heroImages e estado**

Dentro do componente, logo após as linhas de `heroSource` e `description` (por volta da linha 62), adicionar:

```tsx
// Array de imagens para o carrossel — catalogEx tem até 2; wger/fallback sempre 1.
const heroImages: ImageSourcePropType[] = catalogEx
  ? ([
      catalogEx.image_0_url ? { uri: catalogEx.image_0_url } : null,
      catalogEx.image_1_url ? { uri: catalogEx.image_1_url } : null,
    ].filter(Boolean) as ImageSourcePropType[])
  : [wgerImageSource(wgerId) ?? { uri: exerciseImageUrl(muscle, 1200) }];

const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
```

- [ ] **Step 3: Substituir o bloco do hero**

Localizar e substituir o bloco `<View style={[styles.hero, { height: heroHeight }]}>` inteiro (do `<View>` até o `</View>` que fecha o hero, incluindo `<Image>`, `<LinearGradient>`, `<Pressable>` do back, e `<View style={styles.heroText}>`).

Substituir por:

```tsx
{/* Hero cinematográfico via carrossel */}
<HeroCarousel
  images={heroImages}
  height={heroHeight}
  onTap={(idx) => setLightboxIndex(idx)}
>
  {/* Scrim de baixo p/ cima */}
  <LinearGradient
    pointerEvents="none"
    colors={gradients.heroScrim}
    locations={heroScrimLocations}
    style={StyleSheet.absoluteFill}
  />
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="Voltar"
    hitSlop={12}
    onPress={() => goBackOr('/(aluno)/(tabs)/treinos')}
    style={[styles.back, { top: insets.top + darkTheme.spacing.sm }]}
  >
    <CaretLeft size={20} weight="bold" color={colors.textPrimary} />
  </Pressable>
  <View style={styles.heroText}>
    {heroMeta ? (
      <AppText variant="eyebrow" color="neon" numberOfLines={1} style={styles.heroEyebrow}>
        {heroMeta}
      </AppText>
    ) : null}
    <AppText variant="h1" numberOfLines={2}>
      {title}
    </AppText>
  </View>
</HeroCarousel>
```

- [ ] **Step 4: Adicionar ImageLightbox antes do fechamento do ScrollView**

Logo antes de `</ScrollView>` (após o bloco `<View style={styles.body}>`), adicionar:

```tsx
<ImageLightbox
  images={heroImages}
  initialIndex={lightboxIndex ?? 0}
  visible={lightboxIndex !== null}
  onClose={() => setLightboxIndex(null)}
/>
```

- [ ] **Step 5: Remover heroSource (não usado mais)**

Localizar e remover a linha:
```tsx
const heroSource = catalogEx?.image_0_url
  ? { uri: catalogEx.image_0_url }
  : wgerImageSource(wgerId) ?? { uri: exerciseImageUrl(muscle, 1200) };
```

- [ ] **Step 6: Typecheck completo**

```bash
cd /mnt/h/Actus/app && npx tsc --noEmit --skipLibCheck 2>&1 | head -40
```

Esperado: 0 erros.

- [ ] **Step 7: Commit**

```bash
cd /mnt/h/Actus && git add app/src/components/exercises/ "app/app/(aluno)/exercicio/[id].tsx" && git commit -m "feat(exercicio): carrossel de 2 imagens + lightbox fullscreen no hero"
```

---

### Task 4: Fix margin-top no botão Par-Q (anotação 1)

**Files:**
- Buscar e modificar o componente que renderiza o botão "Par-Q · válido até..."

O botão é renderizado na rota `/` (home do aluno). Localizar o arquivo correto e adicionar `marginTop: 10` no estilo do botão.

- [ ] **Step 1: Localizar o arquivo**

```bash
grep -r "Par-Q\|parq\|PARQ" /mnt/h/Actus/app/src --include="*.tsx" -l
```

- [ ] **Step 2: Adicionar marginTop no estilo do botão**

Encontrar o estilo do botão "Par-Q" e adicionar `marginTop: 10` (ou usar o token `spacing.sm` do tema se equivalente a ~10px).

- [ ] **Step 3: Commit**

```bash
cd /mnt/h/Actus && git add -A && git commit -m "fix(home): margin-top no botão Par-Q"
```
