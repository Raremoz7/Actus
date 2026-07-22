import {
  Image,
  Pressable,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from './Text';
import { Logo } from './Logo';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// Faixa-hero editorial: foto (cover) + fade transparente→bgBase + símbolo (ou voltar) no
// topo-esquerda + eyebrow/título ancorados na base sobre o fade.
// - compact: hero baixo do wizard (form-heavy); normal: telas de propósito único.
// - onBack: se setado, mostra o caret de voltar no topo-esquerda em vez do símbolo.
// - titleSize: tamanho do título display (cada tela define o seu).
type ScreenHeroProps = {
  photo: ImageSourcePropType;
  eyebrow: string;
  title: string; // aceita '\n' para 2 linhas
  titleSize: number;
  compact?: boolean;
  onBack?: () => void;
};

const BASE_HEIGHT = 168;

// Hero compacto (wizard): altura responsiva — cresce com a tela para preencher o
// espaço disponível e não deixar vão entre o formulário e o CTA ancorado.
// Proporção da altura útil, com piso/teto para não exagerar em telas extremas.
const COMPACT_RATIO = 0.26;
const COMPACT_MIN = 150;
const COMPACT_MAX = 248;

export function ScreenHero({
  photo,
  eyebrow,
  title,
  titleSize,
  compact = false,
  onBack,
}: ScreenHeroProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // Área útil = janela menos as safe areas; o compacto ocupa uma fração dela.
  const usableHeight = windowHeight - insets.top - insets.bottom;
  const compactHeight = Math.round(
    Math.min(COMPACT_MAX, Math.max(COMPACT_MIN, usableHeight * COMPACT_RATIO)),
  );
  const height = (compact ? compactHeight : BASE_HEIGHT) + insets.top;

  return (
    <View style={[styles.root, { height }]}>
      <Image source={photo} style={styles.photo} resizeMode="cover" accessible={false} />
      <LinearGradient
        colors={['transparent', colors.bgBase]}
        locations={[0.35, 1]}
        style={styles.fade}
      />

      <View style={[styles.top, { top: insets.top + 12 }]}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={12}
            onPress={onBack}
            style={styles.backBtn}
          >
            <CaretLeft size={22} weight="bold" color={colors.textPrimary} />
          </Pressable>
        ) : (
          <Logo variant="symbol" color="neon" width={28} />
        )}
      </View>

      <View style={styles.caption}>
        <AppText variant="eyebrow" color="primary" style={styles.eyebrow}>
          {eyebrow}
        </AppText>
        <AppText
          variant="h1"
          style={[styles.title, { fontSize: titleSize, lineHeight: Math.round(titleSize * 0.92) }]}
        >
          {title}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.colors.bgBase,
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  top: {
    position: 'absolute',
    left: theme.spacing.lg,
  },
  // Botão voltar com scrim circular: garante contraste do caret branco sobre qualquer
  // foto (sem o fundo, o caret some em fotos claras — ver telas de auth).
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
  },
  eyebrow: {
    marginBottom: theme.spacing.xs,
  },
  title: {},
}));
