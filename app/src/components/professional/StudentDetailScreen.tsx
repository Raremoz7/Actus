import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, KpiNumber } from '@/components/ui';
import { useStudents } from '@/hooks/useStudents';
import { useStudentCheckIns } from '@/hooks/useStudentCheckIns';
import { useMe } from '@/hooks/useMe';
import { calcAge, formatCheckInDate } from '@/lib/student';
import { studentInitials } from './StudentRow';
import type { Student } from '@/types/professional';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// Quantos check-ins recentes listar (a KPI mostra o total real).
const RECENT_LIMIT = 6;

// Nome exibido: full_name quando há, senão o e-mail (mesmo critério da lista).
function displayName(student: Student): string {
  const name = student.full_name?.trim();
  return name && name.length > 0 ? name : student.email;
}

type Props = {
  // id do aluno (vem de useLocalSearchParams na rota; injetado aqui para testabilidade).
  id: string;
};

// Detalhe do aluno — reutilizado por personal e nutricionista.
// NÃO existe GET de detalhe: os dados de identidade vêm do cache de useStudents
// (achados pelo id). Em deep link sem cache, mostramos um fallback discreto.
// A atividade recente vem de useStudentCheckIns.
export function StudentDetailScreen({ id }: Props) {
  const list = useStudents();
  const checkIns = useStudentCheckIns(id || undefined);
  const me = useMe();

  // 1 momento de motion por tela: reveal de entrada (opacity, 300ms).
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const student = useMemo(
    () => list.data?.students.find((s) => s.id === id),
    [list.data, id],
  );

  const age = useMemo(() => {
    if (!student?.birth_date) return null;
    return calcAge(student.birth_date, new Date());
  }, [student]);

  const checkInList = checkIns.data?.check_ins ?? [];
  const recent = checkInList.slice(0, RECENT_LIMIT);

  const role = me.data?.tipo;

  function handleAssign() {
    if (!id) return;
    if (role === 'personal') {
      // Atribui um TEMPLATE existente ao aluno (escolhe treino + dias da semana).
      router.push(('/atribuir-treino?student=' + id) as Href);
    } else if (role === 'nutricionista') {
      // Atribui um TEMPLATE existente ao aluno (escolhe a dieta).
      router.push(('/atribuir-dieta?student=' + id) as Href);
    }
  }

  const name = student ? displayName(student) : null;

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
        <AppText variant="eyebrow" color="tertiary">
          Aluno
        </AppText>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {student ? (
            <>
              <View style={styles.identity}>
                <View style={styles.avatar}>
                  <AppText variant="h3" color="neon">
                    {studentInitials(name ?? '')}
                  </AppText>
                </View>
                <View style={styles.identityText}>
                  <AppText variant="h2" numberOfLines={2}>
                    {name}
                  </AppText>
                  <AppText variant="metaSmall" color="tertiary" numberOfLines={1}>
                    {student.email}
                  </AppText>
                  {age !== null ? (
                    <AppText variant="bodySm" color="secondary">
                      {age} anos
                    </AppText>
                  ) : null}
                </View>
              </View>

              <View style={styles.kpiCard}>
                <AppText variant="eyebrow" color="tertiary">
                  Check-ins
                </AppText>
                <KpiNumber value={checkInList.length} size="big" />
              </View>

              <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
                Atividade recente
              </AppText>

              {checkIns.isError ? (
                <AppText variant="bodySm" color="tertiary">
                  Não foi possível carregar a atividade.
                </AppText>
              ) : recent.length > 0 ? (
                <View style={styles.checkInList}>
                  {recent.map((c, i) => (
                    <View key={`${c.check_in_date}-${i}`} style={styles.checkInRow}>
                      <View style={styles.dot} />
                      <AppText variant="dataMed" color="primary">
                        {formatCheckInDate(c.check_in_date)}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : checkIns.isLoading ? (
                <AppText variant="bodySm" color="tertiary">
                  Carregando…
                </AppText>
              ) : (
                <AppText variant="bodySm" color="tertiary">
                  Sem check-ins ainda.
                </AppText>
              )}
            </>
          ) : list.isLoading ? (
            <AppText variant="bodySm" color="tertiary">
              Carregando…
            </AppText>
          ) : (
            // Fallback discreto: deep link / cache ausente (sem GET de detalhe).
            <AppText variant="bodySm" color="tertiary">
              Aluno não encontrado nesta sessão.
            </AppText>
          )}
        </ScrollView>
      </Animated.View>

      {student && role === 'personal' ? (
        <View style={styles.ctaBar}>
          <Button label="Atribuir treino" onPress={handleAssign} />
        </View>
      ) : null}

      {student && role === 'nutricionista' ? (
        <View style={styles.ctaBar}>
          <Button label="Atribuir dieta" onPress={handleAssign} />
        </View>
      ) : null}
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
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: 112 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  kpiCard: {
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  secLabel: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  checkInList: {
    gap: theme.spacing.md,
  },
  checkInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
  },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.bgBase,
  },
}));
