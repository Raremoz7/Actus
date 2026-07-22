// Card de resumo de macros da dieta. Calorias em destaque no topo (número-herói +
// % da meta + barra grossa) e, abaixo, os 3 macros (prot/carb/gord) numa linha com
// valor/meta separados. Redesenho do card antigo, que espremia "valor/meta" em 4
// colunas e colava/estourava os números em telas estreitas. (TEC-94)

import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Card } from '@/components/ui';

export type DietMacro = {
  key: string;
  label: string; // "Prot" | "Carb" | "Gord"
  value: number;
  target: number | null;
};

export type DietMacroCardProps = {
  kcalValue: number;
  kcalTarget: number | null;
  macros: DietMacro[];
  // Ao menos uma refeição não informou macros → o somatório está incompleto.
  partial?: boolean;
};

function ratioOf(value: number, target: number | null): number | null {
  return target != null && target > 0 ? Math.min(value / target, 1) : null;
}

export function DietMacroCard({
  kcalValue,
  kcalTarget,
  macros,
  partial = false,
}: DietMacroCardProps) {
  const kcalRatio = ratioOf(kcalValue, kcalTarget);
  const kcalPct =
    kcalTarget != null && kcalTarget > 0
      ? Math.round((kcalValue / kcalTarget) * 100)
      : null;

  return (
    <Card style={styles.card}>
      {/* Calorias em destaque */}
      <View style={styles.kcalHead}>
        <AppText variant="eyebrow" color="tertiary">
          Calorias
        </AppText>
        {kcalPct != null ? (
          <AppText variant="metaSmall" color="tertiary">
            {`${kcalPct}% da meta`}
          </AppText>
        ) : null}
      </View>
      <View style={styles.kcalValueRow}>
        <AppText variant="dataBig" color="neon">
          {String(kcalValue)}
        </AppText>
        <AppText variant="bodySm" color="secondary" style={styles.kcalUnit}>
          {kcalTarget != null ? `/ ${kcalTarget} kcal` : 'kcal'}
        </AppText>
      </View>
      {kcalRatio != null ? (
        <View style={styles.trackLg}>
          <View style={[styles.fillLg, { width: `${kcalRatio * 100}%` }]} />
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* Macros: prot / carb / gord */}
      <View style={styles.macroRow}>
        {macros.map((m) => {
          const ratio = ratioOf(m.value, m.target);
          return (
            <View key={m.key} style={styles.macroCol}>
              <AppText variant="eyebrow" color="tertiary" numberOfLines={1}>
                {m.label}
              </AppText>
              <View style={styles.macroValRow}>
                <AppText variant="dataMed" color="primary">
                  {String(m.value)}
                </AppText>
                <AppText variant="metaSmall" color="tertiary">
                  {m.target != null ? `/ ${m.target} g` : 'g'}
                </AppText>
              </View>
              {ratio != null ? (
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {partial ? (
        <AppText variant="metaSmall" color="tertiary" style={styles.partial}>
          Totais parciais — nem toda refeição tem macros
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    gap: theme.spacing.sm,
  },
  kcalHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  kcalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  kcalUnit: {
    marginBottom: 2,
  },
  trackLg: {
    height: 4,
    alignSelf: 'stretch',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.outlineVariant,
    overflow: 'hidden',
  },
  fillLg: {
    height: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.outlineVariant,
    marginVertical: theme.spacing.xs,
  },
  macroRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  macroCol: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  macroValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  track: {
    height: 3,
    alignSelf: 'stretch',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.outlineVariant,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
  },
  partial: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.outlineVariant,
  },
}));
