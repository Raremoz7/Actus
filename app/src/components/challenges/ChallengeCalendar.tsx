import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';

type Props = {
  startsOn: string; // YYYY-MM-DD
  endsOn: string;   // YYYY-MM-DD
  today: string;    // YYYY-MM-DD (calculado na tela com formatDateLocal — nunca new Date() aqui)
};

type CellState = 'past' | 'today' | 'future' | 'end' | 'out';

type Cell = {
  dateStr: string;
  dayOfMonth: number;
  state: CellState;
};

// Converte YYYY-MM-DD → número ordinal de dias UTC (só para comparação).
function dateToOrdinal(d: string): number {
  const [y, m, day] = d.split('-').map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, day!) / 86_400_000);
}

// Número ordinal → YYYY-MM-DD via componentes UTC.
function ordinalToDateStr(n: number): string {
  const d = new Date(n * 86_400_000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayOfMonth(dateStr: string): number {
  return parseInt(dateStr.slice(8), 10);
}

function monthOf(dateStr: string): number {
  return parseInt(dateStr.slice(5, 7), 10);
}

const MONTH_NAMES: Record<number, string> = {
  1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
  5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
  9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro',
};

// Constrói as semanas (Dom–Sáb) que cobrem o período startsOn..endsOn.
// Células fora do intervalo do desafio têm state='out'.
function buildWeeks(startsOn: string, endsOn: string, today: string): Cell[][] {
  const startOrd = dateToOrdinal(startsOn);
  const endOrd = dateToOrdinal(endsOn);
  const todayOrd = dateToOrdinal(today);

  const startDow = new Date(startOrd * 86_400_000).getUTCDay(); // 0=Dom
  const firstSunOrd = startOrd - startDow;

  const endDow = new Date(endOrd * 86_400_000).getUTCDay();
  const lastSatOrd = endOrd + (6 - endDow);

  const weeks: Cell[][] = [];

  for (let weekStart = firstSunOrd; weekStart <= lastSatOrd; weekStart += 7) {
    const week: Cell[] = [];
    for (let ord = weekStart; ord < weekStart + 7; ord++) {
      const dateStr = ordinalToDateStr(ord);
      let state: CellState;
      if (ord < startOrd || ord > endOrd) {
        state = 'out';
      } else if (ord === endOrd) {
        state = 'end';
      } else if (ord === todayOrd) {
        state = 'today';
      } else if (ord < todayOrd) {
        state = 'past';
      } else {
        state = 'future';
      }
      week.push({ dateStr, dayOfMonth: dayOfMonth(dateStr), state });
    }
    weeks.push(week);
  }

  return weeks;
}

const WDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

export function ChallengeCalendar({ startsOn, endsOn, today }: Props) {
  const weeks = buildWeeks(startsOn, endsOn, today);
  const startMonth = monthOf(startsOn);

  return (
    <View>
      <View style={styles.wdayRow}>
        {WDAYS.map((d, i) => (
          <View key={i} style={styles.wdayCell}>
            <AppText variant="metaSmall" color="tertiary">
              {d}
            </AppText>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => {
        const prevSunMonth = wi > 0 ? monthOf(weeks[wi - 1]![0]!.dateStr) : null;
        const thisSunMonth = monthOf(week[0]!.dateStr);
        // Não mostrar separador para o mês de início — ele pode aparecer quando a
        // semana 1 tem o domingo no mês anterior (ex: desafio começa numa quinta de junho
        // mas o domingo da semana cai em maio → semana 2 dispararia "Junho" desnecessário).
        const showSeparator =
          prevSunMonth !== null &&
          thisSunMonth !== prevSunMonth &&
          thisSunMonth !== startMonth;

        return (
          <View key={week[0]!.dateStr}>
            {showSeparator && (
              <AppText variant="metaSmall" color="tertiary" style={styles.monthSep}>
                {MONTH_NAMES[thisSunMonth] ?? ''}
              </AppText>
            )}
            <View style={styles.weekRow}>
              {week.map((cell) => {
                const isOut = cell.state === 'out';
                const label =
                  cell.state === 'today'
                    ? `${cell.dayOfMonth}, hoje`
                    : cell.state === 'end'
                    ? `${cell.dayOfMonth}, fim`
                    : isOut
                    ? undefined
                    : String(cell.dayOfMonth);

                return (
                  <View
                    key={cell.dateStr}
                    accessible={!isOut}
                    accessibilityLabel={label}
                    style={[
                      styles.cell,
                      cell.state === 'past' && styles.cellPast,
                      cell.state === 'today' && styles.cellToday,
                      cell.state === 'future' && styles.cellFuture,
                      cell.state === 'end' && styles.cellEnd,
                    ]}
                  >
                    {!isOut && (
                      <AppText
                        variant="metaSmall"
                        color={
                          cell.state === 'end'
                            ? 'inverse'
                            : cell.state === 'today'
                            ? 'neon'
                            : 'tertiary'
                        }
                      >
                        {String(cell.dayOfMonth)}
                      </AppText>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wdayRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  wdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1.5,
  },
  cellPast: {
    backgroundColor: theme.colors.surface3,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: theme.colors.neon,
  },
  cellFuture: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  cellEnd: {
    backgroundColor: theme.colors.neon,
  },
  monthSep: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
}));
