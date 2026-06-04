import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText } from '@/components/ui';
import {
  HomeHeader,
  WeekStrip,
  TodayWorkoutCard,
  DietCard,
  ChallengeCard,
} from '@/components/home';
import { useMe } from '@/hooks/useMe';
import { useWeeklyOverview } from '@/hooks/useWeeklyOverview';
import { useTodayWorkout } from '@/hooks/useTodayWorkout';
import { useStudentDiet } from '@/hooks/useStudentDiet';
import { useChallengeTeaser } from '@/hooks/useChallengeTeaser';
import { greetingForHour } from '@/lib/greeting';
import { nextMealMock } from '@/mocks/home';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

// Rótulo de data PT curto: "Terça · 03 jun". Usa componentes LOCAIS do Date.
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function dateLabelLocal(d: Date): string {
  return `${DIAS[d.getDay()]} · ${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
}

export default function AlunoHojeScreen() {
  const me = useMe();
  const week = useWeeklyOverview();
  const workout = useTodayWorkout();
  const diet = useStudentDiet();
  const challenge = useChallengeTeaser();

  // ÚNICA animação da tela: reveal de entrada (opacity + translateY, 300ms).
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

  const now = new Date();
  const greeting = greetingForHour(now.getHours());

  // [fluxo futuro] destino real do treino = Bloco 5 (execução de sessão).
  function startWorkout() {
    router.push('/(aluno)/(tabs)/treinos' as Href);
  }
  function seeWeek() {
    router.push('/(aluno)/(tabs)/treinos' as Href);
  }

  return (
    <Screen scroll padded>
      <Animated.View style={revealStyle}>
        <HomeHeader
          greeting={greeting}
          name={me.data?.display_name ?? null}
          streakCurrent={week.data?.streak_current ?? 0}
          dateLabel={dateLabelLocal(now)}
        />

        {workout.data ? (
          <TodayWorkoutCard summary={workout.data} onStart={startWorkout} onSeeWeek={seeWeek} />
        ) : null}

        {week.data ? (
          <View style={styles.block}>
            <WeekStrip overview={week.data} />
          </View>
        ) : null}

        <View style={styles.row}>
          {diet.data ? (
            <DietCard
              title={diet.data.title}
              nextMealTime={nextMealMock.time}
              onPress={() => router.push('/(aluno)/(tabs)/treinos' as Href)}
            />
          ) : null}
          {challenge.data ? (
            <ChallengeCard
              title={challenge.data.title}
              current={challenge.data.progress_current}
              total={challenge.data.progress_total}
              onPress={() => router.push('/(aluno)/(tabs)/desafios' as Href)}
            />
          ) : null}
        </View>

        {workout.isError && week.isError ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tentar de novo"
            onPress={() => {
              void me.refetch();
              void week.refetch();
              void workout.refetch();
              void diet.refetch();
              void challenge.refetch();
            }}
            style={styles.retry}
          >
            <AppText variant="bodySm" color="tertiary">
              Não foi possível carregar agora. Tentar de novo.
            </AppText>
          </Pressable>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  block: { marginTop: theme.spacing.lg },
  retry: { marginTop: theme.spacing.lg, alignItems: 'center' },
  row: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg },
}));
