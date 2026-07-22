import { useEffect } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import {
  ArrowDown,
  ArrowUp,
  Barbell,
  Flame,
  Minus,
  Timer,
  TrendUp,
} from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button } from '@/components/ui';
import { darkTheme } from '@/theme';
import type { LoadEvolutionRow, WorkoutFinishSummary } from '@/types/sessions';

const { colors, motion, spacing, layout } = darkTheme;

type SessionFinishSummaryProps = {
  summary: WorkoutFinishSummary;
  onDone: () => void;
};

// Texto plano do Share Sheet montado a partir do DTO `share` (layout strava_style_v1).
// Sem markdown/emoji — só rótulos, métricas e destaques, idêntico ao card.
function buildShareMessage(summary: WorkoutFinishSummary): string {
  const { share } = summary;
  const lines: string[] = [share.title];
  if (share.subtitle) lines.push(share.subtitle);
  lines.push('');
  lines.push(`Duração ${share.duration_label}`);
  for (const m of share.metrics) {
    lines.push(`${m.label}: ${m.value}`);
  }
  if (share.highlights.length > 0) {
    lines.push('');
    for (const h of share.highlights) lines.push(h);
  }
  return lines.join('\n');
}

// Sinal e cor da evolução de carga por exercício.
function deltaLabel(delta: number): string {
  if (delta > 0) return `+${delta} kg`;
  if (delta < 0) return `${delta} kg`;
  return 'mantido';
}

function DeltaIcon({ delta }: { delta: number | null }) {
  if (delta == null || delta === 0) {
    return <Minus size={16} weight="bold" color={colors.textTertiary} />;
  }
  if (delta > 0) return <ArrowUp size={16} weight="bold" color={colors.secondary} />;
  return <ArrowDown size={16} weight="bold" color={colors.warning} />;
}

export function SessionFinishSummary({ summary, onDone }: SessionFinishSummaryProps) {
  const insets = useSafeAreaInsets();
  // 1 motion por tela: um único reveal do resumo (fade + leve subida).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  async function handleShare() {
    try {
      await Share.share({ message: buildShareMessage(summary) });
    } catch {
      // Compartilhar é opcional — cancelar/erro não interrompe o fluxo.
    }
  }

  const hasEvolution =
    !summary.share.hide_load_evolution && summary.load_evolution.length > 0;

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: layout.tabBarSafePaddingLg + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={revealStyle}>
          <AppText variant="eyebrow" color="neon">
            Treino concluído
          </AppText>
          <AppText variant="h1" style={styles.title}>
            {summary.share.title}
          </AppText>
          {summary.share.subtitle ? (
            <AppText variant="bodyMd" color="secondary" style={styles.subtitle}>
              {summary.share.subtitle}
            </AppText>
          ) : null}

          {/* Três números-herói: duração, calorias, volume. */}
          <View style={styles.heroRow}>
            <HeroMetric
              icon={<Timer size={18} weight="duotone" color={colors.textSecondary} />}
              value={summary.duration_label}
              label="Duração"
            />
            <HeroMetric
              icon={<Flame size={18} weight="duotone" color={colors.textSecondary} />}
              value={String(summary.estimated_calories_kcal)}
              label="kcal"
            />
            <HeroMetric
              icon={<Barbell size={18} weight="duotone" color={colors.textSecondary} />}
              value={summary.has_load_data ? String(summary.total_volume_kg) : '—'}
              label="kg volume"
            />
          </View>

          {summary.share.highlights.length > 0 ? (
            <View style={styles.highlights}>
              {summary.share.highlights.map((h) => (
                <View key={h} style={styles.highlightRow}>
                  <TrendUp size={16} weight="duotone" color={colors.neon} />
                  <AppText variant="bodySm" color="secondary" style={styles.highlightText}>
                    {h}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {hasEvolution ? (
            <View style={styles.section}>
              <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
                Evolução de carga
              </AppText>
              {summary.load_evolution.map((row: LoadEvolutionRow) => (
                <View key={row.workout_exercise_id} style={styles.evoRow}>
                  <View style={styles.evoBody}>
                    <AppText variant="bodyMd" numberOfLines={1}>
                      {row.exercise_name}
                    </AppText>
                    <AppText variant="metaSmall" color="tertiary">
                      {row.previous_max_kg != null
                        ? `${row.previous_max_kg} → ${row.current_max_kg} kg`
                        : `${row.current_max_kg} kg`}
                    </AppText>
                  </View>
                  <View style={styles.evoDelta}>
                    <DeltaIcon delta={row.delta_kg} />
                    <AppText
                      variant="dataMed"
                      color={
                        row.delta_kg == null || row.delta_kg === 0
                          ? 'tertiary'
                          : row.delta_kg > 0
                            ? 'neon'
                            : 'secondary'
                      }
                    >
                      {row.delta_kg != null ? deltaLabel(row.delta_kg) : 'novo'}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {summary.branding?.professional_display_name ? (
            <AppText variant="metaSmall" color="tertiary" style={styles.branding}>
              Acompanhamento de {summary.branding.professional_display_name}
            </AppText>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: spacing.lg + insets.bottom }]}>
        <Button
          variant="secondary"
          label="Compartilhar"
          onPress={() => {
            void handleShare();
          }}
        />
        <View style={styles.ctaGap} />
        <Button label="Concluir" onPress={onDone} />
      </View>
    </View>
  );
}

function HeroMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.heroMetric}>
      {icon}
      <AppText variant="dataBig" color="neon" numberOfLines={1} style={styles.heroValue}>
        {value}
      </AppText>
      <AppText variant="metaSmall" color="tertiary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: layout.tabBarSafePaddingLg,
  },
  title: { marginTop: theme.spacing.sm },
  subtitle: { marginTop: theme.spacing.xs },
  heroRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  heroMetric: {
    flex: 1,
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  heroValue: { marginTop: theme.spacing.xs },
  highlights: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  highlightText: { flex: 1 },
  section: { marginTop: theme.spacing.xl },
  secLabel: { marginBottom: theme.spacing.sm },
  evoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface1,
    marginBottom: theme.spacing.sm,
  },
  evoBody: { flex: 1, gap: theme.spacing.xs },
  evoDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  branding: {
    marginTop: theme.spacing.xl,
    textAlign: 'center',
  },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.bgBase,
  },
  ctaGap: { width: theme.spacing.md },
}));
