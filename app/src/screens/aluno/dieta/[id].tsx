import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useLocalSearchParams } from '@/navigation';
import { CaretLeft, Drop, NotePencil } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Tag } from '@/components/ui';
import { DietMacroCard, MealCard } from '@/components/diet';
import { useStudentDietDetail } from '@/hooks/useStudentDietDetail';
import { parseDietBody, type Meal } from '@/types/diets';
import { dietTotals, hasAnyMacro } from '@/lib/diet';
import { shortDateBr } from '@/lib/format';
import { goBackOr } from '@/lib/nav';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// Converte um horário de refeição ('08:00', '8h', 'Pós-treino') em minutos do dia,
// ou null quando não há um horário cravado (texto livre não conta para "próxima").
function timeToMinutes(time: string | undefined): number | null {
  if (!time) return null;
  const m = /(\d{1,2})[:h](\d{2})?/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] != null ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

// Índice da próxima refeição do dia: a mais cedo cujo horário ainda não passou
// (hora LOCAL). Sem horários futuros (ou sem horários) → -1 (nenhum destaque).
function nextMealIndex(meals: Meal[], nowMinutes: number): number {
  let best = -1;
  let bestMin = Infinity;
  meals.forEach((meal, i) => {
    const mins = timeToMinutes(meal.time);
    if (mins == null || mins < nowMinutes) return;
    if (mins < bestMin) {
      bestMin = mins;
      best = i;
    }
  });
  return best;
}

export default function DietaDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');
  const detail = useStudentDietDetail(id);

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const diet = detail.data;
  const body = diet ? parseDietBody(diet.template_body) : null;
  const meals = body?.meals ?? [];
  const totals = dietTotals(meals);
  const showTotals = hasAnyMacro(meals);

  // Próxima refeição de verdade (hora local) — só destaca uma quando há horários.
  const now = new Date();
  const nextIndex = nextMealIndex(meals, now.getHours() * 60 + now.getMinutes());

  // Totais parciais: a faixa some macros só das refeições que os têm. Avisa quando
  // pelo menos uma refeição não informou macro algum (o somatório está incompleto).
  const mealsWithMacro = meals.filter(
    (m) => m.kcal != null || m.protein != null || m.carbs != null || m.fat != null,
  ).length;
  const partialTotals = showTotals && mealsWithMacro < meals.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => goBackOr('/(aluno)/(tabs)')}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <AppText variant="eyebrow" color="tertiary">
          Dieta
        </AppText>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {diet ? (
            <>
              <View style={styles.titleRow}>
                <AppText variant="h2" style={styles.title}>
                  {diet.template_name}
                </AppText>
                {diet.is_active ? <Tag label="Ativa" tone="active" /> : null}
              </View>
              <AppText variant="metaSmall" color="tertiary" style={styles.meta}>
                {`desde ${shortDateBr(diet.start_date)} · ${meals.length} ${
                  meals.length === 1 ? 'refeição' : 'refeições'
                } · atualizada em ${shortDateBr(diet.updated_at.slice(0, 10))}`}
              </AppText>

              {showTotals ? (
                <View style={styles.macroCardWrap}>
                  <DietMacroCard
                    kcalValue={totals.kcal}
                    kcalTarget={body?.target_kcal ?? null}
                    macros={[
                      { key: 'prot', label: 'Prot', value: totals.protein, target: body?.target_protein ?? null },
                      { key: 'carb', label: 'Carb', value: totals.carbs, target: body?.target_carbs ?? null },
                      { key: 'gord', label: 'Gord', value: totals.fat, target: body?.target_fat ?? null },
                    ]}
                    partial={partialTotals}
                  />
                </View>
              ) : null}

              {body?.notes ? (
                <View style={styles.notesBlock}>
                  <View style={styles.notesHead}>
                    <NotePencil size={14} weight="duotone" color={colors.neon} />
                    <AppText variant="eyebrow" color="tertiary">
                      Do seu nutricionista
                    </AppText>
                  </View>
                  <AppText variant="bodySm" color="secondary">
                    {body.notes}
                  </AppText>
                </View>
              ) : null}

              {body?.water != null ? (
                <View style={styles.water}>
                  <Drop size={16} weight="duotone" color={colors.neon} />
                  <AppText variant="bodySm" color="secondary">
                    Meta de água do dia
                  </AppText>
                  <AppText variant="dataMed" color="neon" style={styles.waterValue}>
                    {body.water >= 1000
                      ? `${(body.water / 1000)
                          .toFixed(1)
                          .replace(/\.0$/, '')
                          .replace('.', ',')} L`
                      : `${body.water} ml`}
                  </AppText>
                </View>
              ) : null}

              {meals.length > 0 ? (
                <>
                  <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
                    Refeições
                  </AppText>
                  {meals.map((m, i) => (
                    <MealCard
                      key={`${m.name}-${i}`}
                      name={m.name}
                      time={m.time ?? null}
                      foods={m.foods ?? null}
                      kcal={m.kcal ?? null}
                      protein={m.protein ?? null}
                      carbs={m.carbs ?? null}
                      fat={m.fat ?? null}
                      isNext={i === nextIndex}
                    />
                  ))}
                </>
              ) : (
                <AppText variant="bodySm" color="tertiary" style={styles.secLabel}>
                  Esta dieta ainda não tem refeições.
                </AppText>
              )}
            </>
          ) : detail.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={colors.textTertiary} />
            </View>
          ) : (
            <AppText variant="bodySm" color="tertiary">
              Não foi possível carregar a dieta.
            </AppText>
          )}
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
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  center: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  title: { flex: 1 },
  meta: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.md },
  macroCardWrap: {
    marginBottom: theme.spacing.lg,
  },
  notesBlock: {
    backgroundColor: theme.colors.surface1,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.neon,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  notesHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  water: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  waterValue: { marginLeft: 'auto' },
  secLabel: { marginBottom: theme.spacing.md },
}));
