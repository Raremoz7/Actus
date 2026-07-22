import { View } from 'react-native';
import { CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Card } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  title: string;
  // Linha de metadados (dia · nº exercícios · ~min). Mantida como string p/ flexibilidade.
  subtitle: string;
  // "Última vez" do treino (ex.: "Há 3 dias" / "Ainda não feito"). Linha discreta extra.
  lastCompletedLabel?: string;
  onPress: () => void;
};

export function WorkoutListRow({ title, subtitle, lastCompletedLabel, onPress }: Props) {
  return (
    <Card onPress={onPress} padding="md" style={styles.rowExtra}>
      <View style={styles.body}>
        <AppText variant="h4">
          {title}
        </AppText>
        <AppText variant="metaSmall" color="tertiary" style={styles.sub}>
          {subtitle}
        </AppText>
        {lastCompletedLabel ? (
          <AppText variant="metaSmall" color="tertiary" style={styles.sub}>
            {lastCompletedLabel}
          </AppText>
        ) : null}
      </View>
      <CaretRight size={16} weight="bold" color={colors.textTertiary} />
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  rowExtra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  body: { flex: 1 },
  sub: { marginTop: 2 },
}));
