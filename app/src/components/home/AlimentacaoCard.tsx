import { Pressable, View } from 'react-native';
import { ForkKnife, CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

export function AlimentacaoCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Alimentação" onPress={onPress} style={styles.card}>
      <View style={styles.icon}>
        <ForkKnife size={22} weight="duotone" color={colors.neon} />
      </View>
      <View style={styles.text}>
        <AppText variant="h4">Alimentação</AppText>
        <AppText variant="bodySm" color="tertiary">Registre o que comeu hoje</AppText>
      </View>
      <CaretRight size={18} weight="bold" color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1, borderWidth: 1, borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card, padding: theme.spacing.md,
  },
  icon: { width: 42, height: 42, borderRadius: theme.radius.thumb, backgroundColor: theme.colors.surface2, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
}));
