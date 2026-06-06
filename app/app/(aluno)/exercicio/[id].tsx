import { useEffect } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { CaretLeft, CaretRight, FilmSlate, Note as NoteIcon } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Tag } from '@/components/ui';
import { useWorkoutDetail } from '@/hooks/useWorkoutDetail';
import { exerciseImageUrl } from '@/lib/exerciseImage';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

function parseIntOr(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function ExercicioDemoScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    workoutId?: string;
    position?: string;
    name?: string;
    muscle?: string;
    equipment?: string;
    sets?: string;
    reps?: string;
    rest?: string;
    note?: string;
  }>();
  const name = typeof params.name === 'string' ? params.name : '';
  const muscle = typeof params.muscle === 'string' ? params.muscle : '';
  const equipment = typeof params.equipment === 'string' ? params.equipment : '';
  const note = typeof params.note === 'string' ? params.note : '';
  const workoutId = typeof params.workoutId === 'string' ? params.workoutId : '';
  const position = typeof params.position === 'string' ? Number(params.position) : NaN;

  const sets = parseIntOr(params.sets, 0);
  const reps = parseIntOr(params.reps, 0);
  const rest = Number(params.rest);
  const hasRest = Number.isFinite(rest) && rest >= 0;
  const hasPrescription = sets > 0 && reps > 0;

  // Reaproveita o cache do detalhe do treino p/ navegar entre exercícios irmãos.
  const detail = useWorkoutDetail(workoutId);
  const exercises = detail.data?.workout.exercises ?? [];
  const idx = Number.isFinite(position)
    ? exercises.findIndex((e) => e.position === position)
    : -1;
  const prev = idx > 0 ? exercises[idx - 1] : null;
  const next = idx >= 0 && idx < exercises.length - 1 ? exercises[idx + 1] : null;

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity, params.id]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const title = name || 'Exercício';

  function goTo(sibling: NonNullable<typeof next>) {
    router.replace({
      pathname: '/(aluno)/exercicio/[id]',
      params: {
        id: sibling.id,
        workoutId,
        position: String(sibling.position),
        name: sibling.name_snapshot,
        muscle: sibling.muscle_group ?? '',
        sets: String(sibling.sets),
        reps: String(sibling.reps),
        rest: String(sibling.rest_seconds),
        note: sibling.notes ?? '',
      },
    } as Href);
  }

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

          {/* Prescrição factual em mono — o conteúdo de maior valor da tela. */}
          {hasPrescription || hasRest ? (
            <View style={styles.prescription}>
              {hasPrescription ? (
                <View style={styles.presItem}>
                  <AppText variant="eyebrow" color="tertiary">
                    Séries × reps
                  </AppText>
                  <AppText variant="dataBig" color="neon">
                    {`${sets}×${reps}`}
                  </AppText>
                </View>
              ) : null}
              {hasRest ? (
                <View style={styles.presItem}>
                  <AppText variant="eyebrow" color="tertiary">
                    Descanso
                  </AppText>
                  <AppText variant="dataBig">
                    {`${rest}s`}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Nota do personal para este exercício. */}
          {note ? (
            <View style={styles.noteCard}>
              <NoteIcon size={16} weight="duotone" color={colors.textSecondary} />
              <AppText variant="bodySm" color="secondary" style={styles.noteText}>
                {note}
              </AppText>
            </View>
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

          {/* Navegação entre exercícios do mesmo treino. */}
          {prev || next ? (
            <View style={styles.nav}>
              {prev ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Anterior: ${prev.name_snapshot}`}
                  style={[styles.navBtn, styles.navPrev]}
                  onPress={() => goTo(prev)}
                >
                  <CaretLeft size={16} weight="bold" color={colors.textSecondary} />
                  <AppText variant="metaSmall" color="secondary" numberOfLines={1}>
                    {prev.name_snapshot}
                  </AppText>
                </Pressable>
              ) : (
                <View style={styles.navSpacer} />
              )}
              {next ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Próximo: ${next.name_snapshot}`}
                  style={[styles.navBtn, styles.navNext]}
                  onPress={() => goTo(next)}
                >
                  <AppText variant="metaSmall" color="secondary" numberOfLines={1}>
                    {next.name_snapshot}
                  </AppText>
                  <CaretRight size={16} weight="bold" color={colors.textSecondary} />
                </Pressable>
              ) : (
                <View style={styles.navSpacer} />
              )}
            </View>
          ) : null}
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
  // Hero reduzido (16/9) e full-bleed: protagonismo vai p/ a prescrição factual.
  heroWrap: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    aspectRatio: 16 / 9,
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
  prescription: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  presItem: { gap: theme.spacing.xs },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.neon,
    borderRadius: theme.radius.tag,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  noteText: { flex: 1 },
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
  nav: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  navPrev: { justifyContent: 'flex-start' },
  navNext: { justifyContent: 'flex-end' },
  navSpacer: { flex: 1 },
}));
