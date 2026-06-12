import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { UserPlus, ForkKnife } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen } from '@/components/ui';
import { useMe } from '@/hooks/useMe';
import { useStudents } from '@/hooks/useStudents';
import { useDietTemplates } from '@/hooks/useDietTemplates';
import { greetingForHour } from '@/lib/greeting';
import { darkTheme } from '@/theme';

import { DashboardHeader } from './DashboardHeader';
import { KpiCard } from './KpiCard';
import { QuickAction } from './QuickAction';
import { RecentStudents } from './RecentStudents';
import { EngagementCard } from './EngagementCard';

const { colors, motion } = darkTheme;

// Dashboard do nutricionista: KPIs (alunos, dietas) + ações + recentes.
export function NutriDashboard() {
  const me = useMe();
  const students = useStudents();
  const diets = useDietTemplates();

  // 1 momento de motion por tela: reveal de entrada (opacity, 300ms).
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const studentList = students.data?.students ?? [];
  const dietCount = diets.data?.diet_templates.length ?? 0;
  const greeting = greetingForHour(new Date().getHours());

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={revealStyle}>
          <DashboardHeader greeting={greeting} name={me.data?.display_name ?? null} />

          <View style={styles.kpis}>
            <KpiCard value={studentList.length} label="Alunos" />
            <KpiCard value={dietCount} label="Dietas" />
          </View>

          <View style={styles.actions}>
            <QuickAction
              icon={<UserPlus size={22} weight="duotone" color={colors.textInverse} />}
              label="Convidar aluno"
              onPress={() => router.push('/convite' as Href)}
            />
            <QuickAction
              icon={<ForkKnife size={22} weight="duotone" color={colors.textInverse} />}
              label="Nova dieta"
              onPress={() => router.push('/montar-dieta' as Href)}
            />
          </View>

          <View style={styles.section}>
            <RecentStudents
              students={studentList}
              onOpen={(id) => router.push(('/aluno/' + id) as Href)}
            />
          </View>

          <View style={styles.section}>
            <EngagementCard students={studentList} />
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
