import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { Barbell, CaretLeft, HandTap, Info } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, KpiNumber, ListState } from '@/components/ui';
import { useStudents } from '@/hooks/useStudents';
import { useStudentCheckIns } from '@/hooks/useStudentCheckIns';
import { useMe } from '@/hooks/useMe';
import { calcAge, formatCheckInDate } from '@/lib/student';
import type { CheckIn, Student } from '@/types/professional';
import { darkTheme } from '@/theme';
import { studentInitials } from './StudentRow';
import { CheckInHeatmap } from './CheckInHeatmap';
import {
  activeDaysInWindow,
  buildHeatmap,
  daysSinceLastCheckIn,
  isWorkoutCheckIn,
  lastCheckInLabel,
  linkedSinceLabel,
} from './studentPulse';

const { colors, motion } = darkTheme;

// Quantos check-ins listar na timeline (a KPI mostra o total real).
const RECENT_LIMIT = 8;

// Nome exibido: full_name quando há, senão o e-mail (mesmo critério da lista).
function displayName(student: Student): string {
  const name = student.full_name?.trim();
  return name && name.length > 0 ? name : student.email;
}

// Ordena check-ins por data desc (mais recente primeiro) sem depender da ordem da API.
function byDateDesc(a: CheckIn, b: CheckIn): number {
  if (a.check_in_date === b.check_in_date) return 0;
  return a.check_in_date < b.check_in_date ? 1 : -1;
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

  // "Agora" estável por render — base do "há N dias" e da mini-trilha.
  const now = useMemo(() => new Date(), []);

  const age = useMemo(() => {
    if (!student?.birth_date) return null;
    return calcAge(student.birth_date, now);
  }, [student, now]);

  const checkInList = useMemo(
    () => checkIns.data?.check_ins ?? [],
    [checkIns.data],
  );

  // Métricas de aderência (memo sobre a lista bruta).
  const sinceLast = useMemo(() => daysSinceLastCheckIn(checkInList, now), [checkInList, now]);
  const heatmap = useMemo(() => buildHeatmap(checkInList, now), [checkInList, now]);
  const activeDays = useMemo(() => activeDaysInWindow(heatmap), [heatmap]);

  const recent = useMemo(
    () => [...checkInList].sort(byDateDesc).slice(0, RECENT_LIMIT),
    [checkInList],
  );

  const role = me.data?.tipo;
  const sinceLabel = student ? linkedSinceLabel(student.linked_at) : null;

  function goAssignWorkout() {
    if (!id) return;
    router.push(('/atribuir-treino?student=' + id) as Href);
  }

  function goAssignDiet() {
    if (!id) return;
    router.push(('/atribuir-dieta?student=' + id) as Href);
  }

  const name = student ? displayName(student) : null;

  // Rótulo do programa segundo o papel — a copy é honesta: não há GET de
  // atribuições do lado pro, então sinalizamos onde o programa aparece.
  const programLabel = role === 'nutricionista' ? 'dieta' : 'treino';

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
                  <AppText variant="h2" numberOfLines={2} uppercase={false}>
                    {name}
                  </AppText>
                  <AppText variant="metaSmall" color="tertiary" numberOfLines={1}>
                    {student.email}
                  </AppText>
                  <View style={styles.identityMeta}>
                    {age !== null ? (
                      <AppText variant="bodySm" color="secondary">
                        {age} anos
                      </AppText>
                    ) : null}
                    {age !== null && sinceLabel ? (
                      <AppText variant="bodySm" color="tertiary">
                        ·
                      </AppText>
                    ) : null}
                    {sinceLabel ? (
                      <AppText variant="bodySm" color="tertiary">
                        {sinceLabel}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Bloco de aderência: total + recência + mini-trilha de 4 semanas.
                  Enquanto carrega (sem dado prévio), skeleton — não mostrar zeros falsos. */}
              {checkIns.isLoading && !checkIns.data ? (
                <ListState kind="loading" skeletonCount={1} />
              ) : (
                <View style={styles.adherenceCard}>
                  <View style={styles.adherenceTop}>
                    <View style={styles.adherenceKpi}>
                      <AppText variant="eyebrow" color="tertiary">
                        Check-ins
                      </AppText>
                      <KpiNumber value={checkInList.length} size="big" />
                    </View>
                    <View style={styles.adherenceKpi}>
                      <AppText variant="eyebrow" color="tertiary">
                        Ativos · 4 sem
                      </AppText>
                      <KpiNumber value={activeDays} size="big" />
                    </View>
                  </View>

                  <AppText
                    variant="dataMed"
                    color={sinceLast !== null && sinceLast <= 1 ? 'neon' : 'secondary'}
                  >
                    {lastCheckInLabel(sinceLast)}
                  </AppText>

                  {checkIns.isError ? null : <CheckInHeatmap cells={heatmap} />}
                </View>
              )}

              <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
                Atividade recente
              </AppText>

              {checkIns.isError ? (
                <AppText variant="bodySm" color="tertiary">
                  Não foi possível carregar a atividade.
                </AppText>
              ) : recent.length > 0 ? (
                <View style={styles.timeline}>
                  {recent.map((c, i) => {
                    const fromWorkout = isWorkoutCheckIn(c);
                    return (
                      <View key={`${c.check_in_date}-${i}`} style={styles.timelineRow}>
                        <View style={styles.timelineIcon}>
                          {fromWorkout ? (
                            <Barbell size={16} weight="duotone" color={colors.neon} />
                          ) : (
                            <HandTap size={16} weight="duotone" color={colors.textSecondary} />
                          )}
                        </View>
                        <AppText variant="dataMed" color="primary">
                          {formatCheckInDate(c.check_in_date)}
                        </AppText>
                        <View style={styles.timelineSpacer} />
                        <AppText variant="metaSmall" color="tertiary">
                          {fromWorkout ? 'Treino' : 'Manual'}
                        </AppText>
                      </View>
                    );
                  })}
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

              {/* Programa atual: sem GET de atribuições do lado pro, sinalizamos
                  honestamente onde o programa aparece (para o aluno). */}
              <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
                Programa atual
              </AppText>
              <View style={styles.programCard}>
                <Info size={18} weight="duotone" color={colors.textTertiary} />
                <AppText variant="bodySm" color="secondary" style={styles.programText}>
                  {`O ${programLabel} atribuído aparece para o aluno no app dele. `}
                  {`Use o botão abaixo para enviar ou trocar o ${programLabel}.`}
                </AppText>
              </View>
            </>
          ) : list.isLoading ? (
            <AppText variant="bodySm" color="tertiary">
              Carregando…
            </AppText>
          ) : (
            // Fallback discreto: deep link / cache ausente (sem GET de detalhe).
            <AppText variant="bodySm" color="tertiary">
              Abra este aluno pela sua lista de alunos.
            </AppText>
          )}
        </ScrollView>
      </Animated.View>

      {student && role === 'personal' ? (
        <View style={styles.ctaBar}>
          <Button label="Atribuir treino" onPress={goAssignWorkout} />
        </View>
      ) : null}

      {student && role === 'nutricionista' ? (
        <View style={styles.ctaBar}>
          <Button label="Atribuir dieta" onPress={goAssignDiet} />
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
  identityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  adherenceCard: {
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  adherenceTop: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
  },
  adherenceKpi: {
    gap: theme.spacing.sm,
  },
  secLabel: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  timeline: {
    gap: theme.spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  timelineIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineSpacer: {
    flex: 1,
  },
  programCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  programText: {
    flex: 1,
  },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.bgBase,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
}));
