# Design Spec — Hero Carousel + Lightbox na tela de exercício

**Data:** 2026-06-12
**Arquivo alvo:** `app/app/(aluno)/exercicio/[id].tsx`
**Componentes novos:** `app/src/components/exercises/HeroCarousel.tsx`, `app/src/components/exercises/ImageLightbox.tsx`

---

## Contexto

A tela de exercício exibe um hero cinematográfico com uma única imagem. O catálogo PT-BR já tem dois campos de imagem por exercício (`image_0_url` e `image_1_url`). Quando ambos estiverem disponíveis, o hero deve permitir deslizar entre as duas imagens com um carrossel sutil, e o tap deve abrir um lightbox fullscreen com a mesma navegabilidade.

---

## Componentes

### `HeroCarousel`

**Localização:** `app/src/components/exercises/HeroCarousel.tsx`

**Props:**
```ts
interface HeroCarouselProps {
  images: ImageSourcePropType[];   // 1 ou 2 fontes
  height: number;                  // heroHeight calculado em [id].tsx
  onTap?: (index: number) => void; // chamado com o índice atual ao tocar
}
```

**Comportamento:**
- Com `images.length === 1`: renderiza a imagem atual sem alteração estrutural, apenas adiciona `onTap` como pressable.
- Com `images.length === 2`: exibe carrossel deslizável entre as duas imagens.

**Layout do carrossel:**
- Container com `width` igual à largura da tela e `overflow: hidden`.
- As duas imagens ficam lado a lado num row interno com `width * 2` de largura.
- `translateX` animado move o row: `0` = página 0, `-width` = página 1.

**Gesto (PanGesture da Gesture Handler):**
```
activeOffsetX: [-12, 12]
failOffsetY:   [-8, 8]
```
- Garante que scroll vertical no `ScrollView` pai não seja interceptado.
- Durante o pan: `translateX = pageOffset + panDelta` (responsivo ao dedo).
- No `onEnd`: snapping com `withSpring` — avança de página se `|delta| > width * 0.3` ou `|velocityX| > 400`; caso contrário retorna à página atual.

**Dots indicator:**
- 2 círculos de 6×6px, posicionados no canto inferior direito do hero, acima do scrim de gradiente.
- Dot ativo: `colors.neon`; inativo: `rgba(255,255,255,0.35)`.
- Opacidade de cada dot é animada via `useAnimatedStyle` + `interpolate` no valor `translateX`, fazendo a transição acontecer durante o próprio arraste — sem salto discreto.
- Visíveis apenas quando `images.length === 2`.

---

### `ImageLightbox`

**Localização:** `app/src/components/exercises/ImageLightbox.tsx`

**Props:**
```ts
interface ImageLightboxProps {
  images: ImageSourcePropType[];
  initialIndex: number;            // 0 ou 1
  visible: boolean;
  onClose: () => void;
}
```

**Layout:**
- `Modal` do React Native com `transparent={true}` e `animationType="fade"` (250ms).
- Fundo: `rgba(0, 0, 0, 0.92)`.
- Imagem ocupa `100%` da largura, `resizeMode="contain"`, centralizada verticalmente com `flex: 1`.
- Botão ✕ fixo no canto superior direito, respeitando `SafeAreaInsets.top`.
- Dots idênticos ao HeroCarousel, centralizados na base da imagem.

**Gesto:**
- Mesmo `PanGesture` do carrossel, mas sem `failOffsetY` (sem ScrollView pai).
- `velocityY > 600` pra baixo: fecha o lightbox com `onClose()`.
- Swipe horizontal: troca entre imagens (mesma lógica de snapping).
- Tap fora da área da imagem (na região escura): chama `onClose()`.

---

## Integração em `[id].tsx`

**Montagem das imagens:**
```ts
const heroImages: ImageSourcePropType[] = catalogEx
  ? [
      catalogEx.image_0_url ? { uri: catalogEx.image_0_url } : null,
      catalogEx.image_1_url ? { uri: catalogEx.image_1_url } : null,
    ].filter(Boolean) as ImageSourcePropType[]
  : [wgerImageSource(wgerId) ?? { uri: exerciseImageUrl(muscle, 1200) }];
```

**Estado do lightbox:**
```ts
const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
```
- `null` = fechado; `0` ou `1` = aberto na imagem correspondente.

**Render:**
```tsx
<HeroCarousel
  images={heroImages}
  height={heroHeight}
  onTap={(idx) => setLightboxIndex(idx)}
/>
<ImageLightbox
  images={heroImages}
  initialIndex={lightboxIndex ?? 0}
  visible={lightboxIndex !== null}
  onClose={() => setLightboxIndex(null)}
/>
```

O bloco `<Image>` atual e o `LinearGradient` + texto do hero permanecem dentro do `HeroCarousel`, mantendo o visual cinematográfico intacto.

---

## Restrições e decisões

| Decisão | Motivo |
|---|---|
| Carrossel só aparece com 2 imagens | Com 1 imagem os dots seriam inúteis e enganosos |
| `failOffsetY: [-8, 8]` no carousel | Evita interceptar scroll vertical no ScrollView pai |
| `withSpring` para snapping | Consistente com o padrão de motion já usado na tela (`withTiming` para fade) |
| Sem dependências novas | `react-native-reanimated` e `react-native-gesture-handler` já estão no Expo SDK 55 |
| `resizeMode="contain"` no lightbox | Garante que a imagem inteira seja visível, sem crop |
| Fechar no swipe pra baixo (velocidade > 600) | Gesto natural de dispensar um modal em mobile |

---

## Fora de escopo

- Zoom/pinch na imagem do lightbox
- Animação de abertura do lightbox baseada na posição da imagem (shared element transition)
- Suporte a mais de 2 imagens
