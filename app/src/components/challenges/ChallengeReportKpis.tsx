// Bloco de KPIs do relatório de um desafio (lado PROFISSIONAL).
// Consome o ProChallengeReport e mostra, em três cartões discretos:
//  - Aderência média (average_adherence_ratio como %)
//  - Média de dias ativos (average_active_days, 1 casa)
//  - Divisão Ativos · Convidados · Recusou (active/invited/declined)
//
// Tudo via tokens; números no estilo `dataMed` (mono). Sem sombra (não é sheet).

import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Card } from '@/components/ui';
import type { ProChallengeReport } from '@/types/challenges';

// Arredonda um ratio 0..1 para inteiro de porcentagem (clamp 0..100).
function ratioToPercent(ratio: number): number {
  const pct = Math.round(ratio * 100);
  if (pct < 0) return 0;
  if (pct > 100) return 100;
  return pct;
}

// Formata a média de dias ativos com no máximo 1 casa, sem '.0' desnecessário.
function formatAverage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

type Props = {
  report: ProChallengeReport;
};

export function ChallengeReportKpis({ report }: Props) {
  const adherence = ratioToPercent(report.average_adherence_ratio);
  const avgDays = formatAverage(report.average_active_days);

  return (
    <View style={styles.grid}>
      <Card padding="lg" style={styles.cardExtra}>
        <AppText variant="eyebrow" color="tertiary">
          Aderência média
        </AppText>
        <View style={styles.valueRow}>
          <AppText variant="dataBig" color="neon">
            {String(adherence)}
          </AppText>
          <AppText variant="metaSmall" color="tertiary" style={styles.unit}>
            %
          </AppText>
        </View>
      </Card>

      <Card padding="lg" style={styles.cardExtra}>
        <AppText variant="eyebrow" color="tertiary">
          Média de dias ativos
        </AppText>
        <View style={styles.valueRow}>
          <AppText variant="dataBig" color="primary">
            {avgDays}
          </AppText>
          <AppText variant="metaSmall" color="tertiary" style={styles.unit}>
            dias
          </AppText>
        </View>
      </Card>

      <Card padding="lg" style={styles.cardExtra}>
        <AppText variant="eyebrow" color="tertiary">
          Participação
        </AppText>
        <View style={styles.splitRow}>
          <SplitStat label="Ativos" value={report.active_count} tone="neon" />
          <View style={styles.splitDivider} />
          <SplitStat label="Convidados" value={report.invited_count} tone="primary" />
          <View style={styles.splitDivider} />
          <SplitStat label="Recusou" value={report.declined_count} tone="tertiary" />
        </View>
      </Card>
    </View>
  );
}

function SplitStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'neon' | 'primary' | 'tertiary';
}) {
  return (
    <View style={styles.splitCol}>
      <AppText variant="dataMed" color={tone}>
        {String(value)}
      </AppText>
      <AppText variant="metaSmall" color="tertiary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  grid: {
    gap: theme.spacing.md,
  },
  cardExtra: {
    gap: theme.spacing.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  unit: {
    marginBottom: 2,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  splitCol: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  splitDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.outlineVariant,
  },
}));
