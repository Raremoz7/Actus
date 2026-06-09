import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { Barbell, CaretRight, Plus } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, Button, ListState, TopBar } from '@/components/ui';
import { useProWorkouts } from '@/hooks/useProWorkouts';
import type { ProWorkoutListItem } from '@/types/workouts';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// Contador no eyebrow: "1 treino" / "N treinos".
function countLabel(n: number): string {
  return n === 1 ? '1 treino' : `${n} treinos`;
}

// Rótulo de exercícios do card: "N exercícios" / "1 exercício".
function exerciseLabel(n: number): string {
  return n === 1 ? '1 exercício' : `${n} exercícios`;
}

type CardProps = {
  workout: ProWorkoutListItem;
  onPress: () => void;
};

// Card de template: ícone + nome + foco/notas (1 linha) + "N exercícios".
// Tocável → abre o builder em modo edição. Visual alinhado ao TodayWorkoutCard
// (surface1 + borda outlineVariant + radius card).
function ProWorkoutCard({ workout, onPress }: CardProps) {
  const notes = workout.notes?.trim();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={workout.name}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.cardIcon}>
        <Barbell size={22} weight="duotone" color={colors.neon} />
      </View>
      <View style={styles.cardText}>
        <AppText variant="h3" numberOfLines={1}>
          {workout.name}
        </AppText>
        {notes && notes.length > 0 ? (
          <AppText variant="bodySm" color="secondary" numberOfLines={1}>
            {notes}
          </AppText>
        ) : null}
        <AppText variant="metaSmall" color="tertiary">
          {exerciseLabel(workout.exercise_count)}
        </AppText>
      </View>
      <CaretRight size={16} weight="bold" color={colors.textTertiary} />
    </Pressable>
  );
}

// Aba de treinos do profissional (personal): lista de templates criados.
// GET /workouts via useProWorkouts. "Novo treino" e cada card abrem o builder
// (/montar-treino), criando ou editando (?id=).
export default function PersonalTreinosScreen() {
  const list = useProWorkouts();

  // 1 momento de motion por tela: reveal de entrada (opacity + translateY, 300ms).
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
    translateY.value = withTiming(0, { duration: motion.screenMs });
  }, [opacity, translateY]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const workouts = useMemo(() => list.data?.workouts ?? [], [list.data]);

  function openBuilder() {
    router.push('/montar-treino' as Href);
  }

  function openWorkout(id: string) {
    router.push(('/montar-treino?id=' + id) as Href);
  }

  const isEmpty = !list.isLoading && !list.isError && workouts.length === 0;

  return (
    <Screen edges={['top']}>
      <TopBar title="Treinos" eyebrow={countLabel(workouts.length)} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
      <Animated.View style={revealStyle}>
        <View style={styles.newBtn}>
          <Button
            variant="primary"
            label="Novo treino"
            icon={<Plus size={18} weight="bold" color={colors.textInverse} />}
            onPress={openBuilder}
          />
        </View>

        <View style={styles.list}>
          {workouts.map((w) => (
            <ProWorkoutCard key={w.id} workout={w} onPress={() => openWorkout(w.id)} />
          ))}
        </View>

        {list.isLoading ? <ListState kind="loading" skeletonCount={3} /> : null}

        {isEmpty ? (
          <ListState
            kind="empty"
            icon={Barbell}
            title="Nenhum treino ainda"
            message="Monte seu primeiro template para atribuir aos alunos"
            actionLabel="Novo treino"
            onAction={openBuilder}
          />
        ) : null}

        {list.isError ? (
          <ListState
            kind="error"
            title="Não foi possível carregar"
            message="Verifique sua conexão e tente novamente."
            actionLabel="Tentar de novo"
            onAction={() => void list.refetch()}
          />
        ) : null}
      </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { padding: theme.spacing.lg },
  newBtn: {
    marginBottom: theme.spacing.xl,
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  note: {
    marginTop: theme.spacing.lg,
  },
}));
