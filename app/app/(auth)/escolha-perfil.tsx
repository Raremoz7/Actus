import { useEffect } from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Logo } from '@/components/ui';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// Foto do hero (academia) — coberta por um degradê neon que vira sólido embaixo,
// onde ficam logo e manifesto (texto escuro, legível).
const HERO_IMAGE = require('../../assets/images/hero-couple.png');

// Enquadramento aprovado pelo designer (mockup 1:1):
const HERO_HEIGHT_RATIO = 0.58; // hero ocupa ~58% da altura da tela
const HERO_IMAGE_ZOOM = 0.9; // foto a 90% da altura do hero; o resto fica sob o neon sólido
const HERO_IMAGE_ASPECT = 1.5; // 1248×832
const HERO_IMAGE_POS_X = 0.32; // recorte horizontal (centro-esquerda)

// Degradê do hero: transparente no topo → neon sólido a partir de 72% (base do bloco).
const HERO_GRADIENT_LOCATIONS = [0, 0.4, 0.72, 1] as const;

export default function EscolhaPerfilScreen() {
  const router = useRouter();

  // Enquadramento da foto: derivado do tamanho real da tela (zoom-out + recorte à esquerda).
  const { width: screenW, height: screenH } = useWindowDimensions();
  const heroHeight = Math.round(screenH * HERO_HEIGHT_RATIO);
  const imageHeight = Math.round(heroHeight * HERO_IMAGE_ZOOM);
  const imageWidth = Math.round(imageHeight * HERO_IMAGE_ASPECT);
  const imageLeft = -Math.round((imageWidth - screenW) * HERO_IMAGE_POS_X);

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

  function go(path: '/(auth)/cadastro' | '/(auth)/professor-info' | '/(auth)/login') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path);
  }

  return (
    <View style={styles.root}>
      {/* Hero: foto full-bleed + degradê neon que vira sólido embaixo. */}
      <Animated.View style={[styles.heroBlock, { height: heroHeight }, blockStyle]}>
        <Image
          source={HERO_IMAGE}
          style={[
            styles.heroImage,
            { width: imageWidth, height: imageHeight, left: imageLeft },
          ]}
          resizeMode="cover"
          accessible={false}
        />
        <LinearGradient
          colors={[
            colors.neonTransparent,
            colors.neonTransparent,
            colors.neon,
            colors.neon,
          ]}
          locations={[...HERO_GRADIENT_LOCATIONS]}
          style={styles.heroGradient}
          pointerEvents="none"
        />
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
    // Neon sólido por baixo cobre o vazio que o zoom-out da foto deixa na base.
    backgroundColor: theme.colors.neon,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  manifesto: {
    marginTop: theme.spacing.lg,
    fontSize: 52,
    lineHeight: Math.round(52 * 0.92),
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
