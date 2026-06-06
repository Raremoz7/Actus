import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { MealCard } from '@/components/diet';
import { useStudentDietDetail } from '@/hooks/useStudentDietDetail';
import { parseDietBody } from '@/types/diets';
import { dietTotals, hasAnyMacro } from '@/lib/diet';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
// Data curta a partir de YYYY-MM-DD por componentes (sem new Date(iso) — fuso).
function shortBr(dateOnly: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!m) return dateOnly;
  return `${m[3]} ${MESES[Number(m[2]) - 1] ?? ''}`;
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
          Dieta
        </AppText>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {diet ? (
            <>
              <AppText variant="h2" style={styles.title}>
                {diet.template_name}
              </AppText>
              <AppText variant="metaSmall" color="tertiary" style={styles.meta}>
                {`desde ${shortBr(diet.start_date)} · ${meals.length} refeições`}
              </AppText>

              {showTotals ? (
                <View style={styles.totband}>
                  {[
                    { n: totals.kcal, l: 'kcal' },
                    { n: totals.protein, l: 'prot' },
                    { n: totals.carbs, l: 'carb' },
                    { n: totals.fat, l: 'gord' },
                  ].map((t) => (
                    <View key={t.l} style={styles.tot}>
                      <AppText variant="dataMed" color="neon">
                        {String(t.n)}
                      </AppText>
                      <AppText variant="metaSmall" color="tertiary">
                        {t.l}
                      </AppText>
                    </View>
                  ))}
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
                      foods={m.foods ?? null}
                      kcal={m.kcal ?? null}
                      protein={m.protein ?? null}
                      carbs={m.carbs ?? null}
                      fat={m.fat ?? null}
                      isNext={i === 0}
                    />
                  ))}
                </>
              ) : (
                <AppText variant="bodySm" color="tertiary" style={styles.secLabel}>
                  Esta dieta ainda não tem refeições.
                </AppText>
              )}

              {body?.notes ? (
                <AppText variant="bodySm" color="tertiary" style={styles.notes}>
                  {body.notes}
                </AppText>
              ) : null}
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
  title: { fontSize: 32, lineHeight: 32 },
  meta: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.md },
  totband: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  tot: { flex: 1, alignItems: 'center' },
  secLabel: { marginBottom: theme.spacing.md },
  notes: { marginTop: theme.spacing.sm },
}));
