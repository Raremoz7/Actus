import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { HEATMAP_WEEKS, type HeatCell } from './studentPulse';

type Props = {
  // Células em ordem cronológica (hoje por último), HEATMAP_WEEKS * 7 no total.
  cells: HeatCell[];
};

// Mini-trilha de aderência das últimas semanas: uma coluna por semana, 7 quadrados
// por coluna (um por dia). Quadrado preenchido (neon) = houve check-in; vazio = dia
// sem registro. Substitui a lista de datas soltas por um padrão visual de constância.
export function CheckInHeatmap({ cells }: Props) {
  // Divide as células em semanas (colunas) de 7 dias, na ordem cronológica.
  const weeks: HeatCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <View
      accessible
      accessibilityLabel={`Aderência das últimas ${HEATMAP_WEEKS} semanas`}
      style={styles.grid}
    >
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.week}>
          {week.map((cell) => (
            <View
              key={cell.date}
              style={[styles.cell, cell.active ? styles.cellActive : styles.cellIdle]}
            />
          ))}
        </View>
      ))}
      <View style={styles.legend}>
        <AppText variant="eyebrow" color="tertiary">
          {HEATMAP_WEEKS} semanas
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  grid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  week: {
    gap: theme.spacing.xs,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: theme.radius.tag,
  },
  cellActive: {
    backgroundColor: theme.colors.neon,
  },
  cellIdle: {
    backgroundColor: theme.colors.surface2,
  },
  legend: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
}));
