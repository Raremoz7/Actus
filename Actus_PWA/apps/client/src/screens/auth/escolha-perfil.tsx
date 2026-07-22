import { useEffect } from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useRouter } from '@/navigation';
import { CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Logo } from '@/components/ui';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// Foto do hero (academia) ocupa o topo; abaixo, um bloco neon SÓLIDO com logo + manifesto.
// Na web, o import de imagem resolve para uma URL (Vite); Image aceita { uri }.
import heroCoupleUrl from '../../../assets/images/hero-couple.png';
const HERO_IMAGE = { uri: heroCoupleUrl } as unknown as number;

// Hero ocupa ~58% da altura da tela; a foto preenche o topo e o bloco neon a base.
const HERO_HEIGHT_RATIO = 0.58;

export default function EscolhaPerfilScreen() {
  const router = useRouter();

  // Altura do hero derivada da tela; a foto ocupa o topo e o bloco neon a base.
  const { height: screenH } = useWindowDimensions();
  const heroHeight = Math.round(screenH * HERO_HEIGHT_RATIO);

  // ÚNICA animação da tela: o bloco do hero desliza de cima no load.
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

  function go(path: '/(auth)/cadastro' | '/(auth)/cadastro-pro' | '/(auth)/login') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Cadastro de aluno começa do zero: descarta convite obsoleto de um deep link
    // anterior — senão um cadastro manual herdaria o vínculo do personal errado.
    if (path === '/(auth)/cadastro') useCadastroDraftStore.getState().clear();
    router.push(path);
  }

  return (
    <View style={styles.root}>
      {/* Hero: foto no topo + bloco neon sólido na base (logo + manifesto sobre ele). */}
      <Animated.View style={[styles.heroBlock, { height: heroHeight }, blockStyle]}>
        <View style={styles.heroPhotoWrap}>
          <Image
            source={HERO_IMAGE}
            style={styles.heroImage}
            resizeMode="cover"
            accessible={false}
          />
        </View>
        <View style={styles.heroContent}>
          <Logo variant="symbol" color="dark" width={44} />
          <AppText variant="h1" color="inverse" style={styles.manifesto}>
            O sistema por trás do movimento
          </AppText>
        </View>
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
            description="Com ou sem convite de um treinador"
            accessibilityLabel="Sou aluno, com convite"
            onPress={() => go('/(auth)/cadastro')}
          />
          <ChoiceCard
            variant="secondary"
            title="Sou professor"
            description="Crio minha conta e convido meus alunos"
            accessibilityLabel="Sou professor"
            onPress={() => go('/(auth)/cadastro-pro')}
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
        <View style={styles.cardIcon}>
          <CaretRight
            size={18}
            weight="duotone"
            color={isPrimary ? colors.textInverse : colors.textTertiary}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  heroBlock: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.colors.neon,
  },
  // Foto preenche o topo do hero; o bloco neon (heroContent) fica abaixo dela.
  heroPhotoWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  // Bloco neon SÓLIDO na base: logo + manifesto sobre ele (texto escuro, legível).
  heroContent: {
    backgroundColor: theme.colors.neon,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  manifesto: {
    marginTop: theme.spacing.lg,
    fontSize: 44,
    lineHeight: Math.round(44 * 0.92),
  },
  base: {
    flex: 1,
  },
  baseInner: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
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
  // Chevron não encolhe se a copy crescer em telas estreitas.
  cardIcon: {
    flexShrink: 0,
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
