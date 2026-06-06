import { useEffect } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeft, FilmSlate } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Tag } from '@/components/ui';
import { exerciseImageUrl } from '@/lib/exerciseImage';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

export default function ExercicioDemoScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    muscle?: string;
    equipment?: string;
  }>();
  const name = typeof params.name === 'string' ? params.name : '';
  const muscle = typeof params.muscle === 'string' ? params.muscle : '';
  const equipment = typeof params.equipment === 'string' ? params.equipment : '';

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const title = name || 'Exercício';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <AppText variant="eyebrow" color="tertiary" numberOfLines={1}>
          {title}
        </AppText>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* [MOCK — imagem ilustrativa por grupo muscular; real virá do Wger] */}
          <View style={styles.heroWrap}>
            <Image
              accessible={false}
              source={{ uri: exerciseImageUrl(muscle, 1200) }}
              resizeMode="cover"
              style={styles.hero}
            />
            <View pointerEvents="none" style={styles.heroVeil} />
          </View>

          <AppText variant="h2">
            {title}
          </AppText>

          {muscle ? (
            <View style={styles.tagRow}>
              <Tag label={muscle} />
            </View>
          ) : null}

          {equipment ? (
            <AppText variant="metaSmall" color="secondary" style={styles.equipment}>
              {equipment}
            </AppText>
          ) : null}

          {/* [MOCK — sem endpoint na API v1: descrição/vídeo do Wger] */}
          <View style={styles.demo}>
            <View style={styles.demoIcon}>
              <FilmSlate size={22} weight="duotone" color={colors.textSecondary} />
            </View>
            <AppText variant="bodySm" color="tertiary" style={styles.demoText}>
              Demonstração em vídeo ainda não disponível para este exercício.
            </AppText>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgBase },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: 96 },
  // Hero full-bleed: margens negativas cancelam o padding lateral do scroll.
  heroWrap: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    aspectRatio: 4 / 3,
    backgroundColor: theme.colors.surface2,
    overflow: 'hidden',
  },
  hero: { width: '100%', height: '100%' },
  heroVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.veil,
  },
  tagRow: { marginTop: theme.spacing.md },
  equipment: { marginTop: theme.spacing.sm },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  demoIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoText: { flex: 1 },
}));
