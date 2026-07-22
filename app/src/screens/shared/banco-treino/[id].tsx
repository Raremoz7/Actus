// Detalhe de um treino da biblioteca (Banco de Treinos). Preview read-only dos
// exercícios + CTA "Clonar e editar", que abre o montar-treino pré-preenchido.
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams, type Href } from '@/navigation';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Card, ListState } from '@/components/ui';
import {
  useWorkoutTemplateDetail,
  useCopyWorkoutTemplate,
} from '@/hooks/useWorkoutTemplates';
import { goBackOr } from '@/lib/nav';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

const TREINOS_HREF = '/(personal)/(tabs)/treinos';

// Rótulo de exercícios: "N exercícios" / "1 exercício".
function exerciseLabel(n: number): string {
  return n === 1 ? '1 exercício' : `${n} exercícios`;
}

export default function BancoTreinoDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const detail = useWorkoutTemplateDetail(id);
  const copy = useCopyWorkoutTemplate();
  const workout = detail.data;

  // 1 momento de motion por tela: reveal de entrada (opacity, 300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.value }));

  // Clona no servidor (POST /:id/copy → workout_id) e abre o builder no novo treino.
  function cloneAndEdit() {
    if (!id || copy.isPending) return;
    copy.mutate(id, {
      onSuccess: ({ workout_id }) => {
        router.replace(('/montar-treino?id=' + workout_id) as Href);
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => goBackOr(TREINOS_HREF)}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <AppText variant="eyebrow" color="tertiary">
          Banco de treinos
        </AppText>
      </View>

      {detail.isLoading ? (
        <View style={styles.empty}>
          <ListState kind="loading" skeletonCount={4} />
        </View>
      ) : detail.isError ? (
        <View style={styles.empty}>
          <ListState
            kind="error"
            title="Não foi possível carregar"
            message="Verifique sua conexão e tente novamente."
            actionLabel="Tentar de novo"
            onAction={() => void detail.refetch()}
          />
        </View>
      ) : !workout ? (
        <View style={styles.empty}>
          <AppText variant="bodyMd" color="secondary">
            Treino não encontrado.
          </AppText>
        </View>
      ) : (
        <Animated.View style={[styles.flex, revealStyle]}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <AppText variant="eyebrow" color="neon">
              {exerciseLabel(workout.exercises.length)}
            </AppText>
            <AppText variant="h2" style={styles.title}>
              {workout.name}
            </AppText>
            {workout.notes ? (
              <AppText variant="bodyMd" color="secondary" style={styles.notes}>
                {workout.notes}
              </AppText>
            ) : null}

            <View style={styles.list}>
              {workout.exercises.map((e) => (
                <Card key={e.id} padding="md" style={styles.rowExtra}>
                  <View style={styles.rowText}>
                    <AppText variant="bodyMd" numberOfLines={1}>
                      {e.name_snapshot}
                    </AppText>
                    <AppText variant="metaSmall" color="tertiary">
                      {`${e.sets}×${e.reps} · descanso ${e.rest_seconds}s${
                        e.notes ? ` · ${e.notes}` : ''
                      }`}
                    </AppText>
                  </View>
                  {e.muscle_group ? (
                    <AppText variant="eyebrow" color="tertiary">
                      {e.muscle_group}
                    </AppText>
                  ) : null}
                </Card>
              ))}
            </View>
          </ScrollView>

          <View style={styles.ctaBar}>
            <Button
              label={copy.isPending ? 'Clonando…' : 'Clonar e editar'}
              disabled={copy.isPending}
              onPress={cloneAndEdit}
            />
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgLowest },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  back: { padding: theme.spacing.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  scroll: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  title: { marginTop: theme.spacing.xs, marginBottom: 2 },
  notes: { marginTop: theme.spacing.sm },
  list: { marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  rowExtra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  rowText: { flex: 1, gap: 2 },
  ctaBar: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
}));
