import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { UserPlus, Barbell, Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen } from '@/components/ui';
import { useMe } from '@/hooks/useMe';
import { useStudents } from '@/hooks/useStudents';
import { useProWorkouts } from '@/hooks/useProWorkouts';
import { useProChallenges } from '@/hooks/useProChallenges';
import { greetingForHour } from '@/lib/greeting';
import { darkTheme } from '@/theme';

import { DashboardHeader } from './DashboardHeader';
import { KpiCard } from './KpiCard';
import { QuickAction } from './QuickAction';
import { RecentStudents } from './RecentStudents';
import { EngagementSoon } from './EngagementSoon';

const { colors, motion } = darkTheme;

// Dashboard do personal: KPIs (alunos, treinos, desafios ativos) + ações + recentes.
export function PersonalDashboard() {
  const me = useMe();
  const students = useStudents();
  const workouts = useProWorkouts();
  const challenges = useProChallenges();

  // 1 momento de motion por tela: reveal de entrada (opacity, 300ms).
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const studentList = students.data?.students ?? [];
  const workoutCount = workouts.data?.workouts.length ?? 0;
  const activeChallenges = (challenges.data?.challenges ?? []).filter(
    (c) => c.status === 'active',
  ).length;
  const greeting = greetingForHour(new Date().getHours());

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={revealStyle}>
          <DashboardHeader greeting={greeting} name={me.data?.display_name ?? null} />

          <View style={styles.kpis}>
            <KpiCard value={studentList.length} label="Alunos" />
            <KpiCard value={workoutCount} label="Treinos" />
            <KpiCard value={activeChallenges} label="Desafios ativos" />
          </View>

          <View style={styles.actions}>
            <QuickAction
              icon={<UserPlus size={22} weight="duotone" color={colors.neon} />}
              label="Convidar aluno"
              onPress={() => router.push('/convite' as Href)}
            />
            <QuickAction
              icon={<Barbell size={22} weight="duotone" color={colors.neon} />}
              label="Novo treino"
              onPress={() => router.push('/montar-treino' as Href)}
            />
            <QuickAction
              icon={<Trophy size={22} weight="duotone" color={colors.neon} />}
              label="Criar desafio"
              onPress={() => router.push('/criar-desafio' as Href)}
            />
          </View>

          <View style={styles.section}>
            <RecentStudents
              students={studentList}
              onOpen={(id) => router.push(('/aluno/' + id) as Href)}
            />
          </View>

          <View style={styles.section}>
            <EngagementSoon />
          </View>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { padding: theme.spacing.lg },
  kpis: { flexDirection: 'row', gap: theme.spacing.sm },
  actions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg },
  section: { marginTop: theme.spacing.xl },
}));
