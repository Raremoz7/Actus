import { View } from 'react-native';
import { ForkKnife, CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Card } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

export function AlimentacaoCard({ onPress }: { onPress: () => void }) {
  return (
    <Card accessibilityLabel="Alimentação" onPress={onPress} style={styles.cardExtra}>
      <View style={styles.icon}>
        <ForkKnife size={22} weight="duotone" color={colors.neon} />
      </View>
      <View style={styles.text}>
        <AppText variant="h4">Alimentação</AppText>
        <AppText variant="bodySm" color="tertiary">Registre o que comeu hoje</AppText>
      </View>
      <CaretRight size={18} weight="bold" color={colors.textTertiary} />
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  cardExtra: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
  },
  icon: { width: 42, height: 42, borderRadius: theme.radius.thumb, backgroundColor: theme.colors.surface2, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
}));
