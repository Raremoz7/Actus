import { View } from 'react-native';
import { ForkKnife } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  name: string;
  foods: string | null;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  // Primeira refeição (próxima): filete e garfo em neon.
  isNext: boolean;
};

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View style={[styles.chip, accent && styles.chipAccent]}>
      <AppText variant="metaSmall" color={accent ? 'neon' : 'secondary'}>
        {label}
      </AppText>
    </View>
  );
}

export function MealCard({ name, foods, kcal, protein, carbs, fat, isNext }: Props) {
  return (
    <View style={[styles.row, isNext ? styles.rowNext : styles.rowRest]}>
      <View style={styles.head}>
        <ForkKnife size={16} weight="duotone" color={isNext ? colors.neon : colors.textTertiary} />
        <AppText variant="h3" style={styles.name}>
          {name}
        </AppText>
      </View>
      {foods ? (
        <AppText variant="bodySm" color="secondary" style={styles.foods}>
          {foods}
        </AppText>
      ) : null}
      <View style={styles.chips}>
        {kcal != null ? <Chip label={`${kcal} kcal`} accent /> : null}
        {protein != null ? <Chip label={`P ${protein}`} /> : null}
        {carbs != null ? <Chip label={`C ${carbs}`} /> : null}
        {fat != null ? <Chip label={`G ${fat}`} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    borderLeftWidth: 2,
    paddingLeft: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  rowNext: { borderLeftColor: theme.colors.neon },
  rowRest: { borderLeftColor: theme.colors.outlineVariant },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  name: { fontSize: 19 },
  foods: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.tag,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.sm,
  },
  chipAccent: { borderColor: theme.colors.neon },
}));
