import { Pressable, View } from 'react-native';
import { CaretRight, ClipboardText } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { shortDateBr } from '@/lib/format';
import { isParqPending, type ParqStatus } from '@/lib/parq';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  status: ParqStatus;
  validUntil?: string | null;
  onPress: () => void;
};

// Card do Par-Q na Home. Pendente/expirado → CTA neon. Em dia/atenção → card discreto,
// ainda pressable: é a porta do aluno para REVISAR/REFAZER as respostas (ex.: saúde mudou).
export function ParqPromptCard({ status, validUntil, onPress }: Props) {
  if (!isParqPending(status)) {
    const valid = validUntil ? `Em dia · válido até ${shortDateBr(validUntil)}` : 'Em dia';
    return (
      <Pressable
        style={styles.cardMuted}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Par-Q em dia. Toque para revisar suas respostas."
      >
        <View style={styles.mutedRow}>
          <View style={styles.mutedText}>
            <View style={styles.head}>
              <ClipboardText size={14} weight="duotone" color={colors.textTertiary} />
              <AppText variant="eyebrow" color="tertiary">Par-Q</AppText>
            </View>
            <AppText variant="bodyMd" color="secondary">{valid}</AppText>
          </View>
          <CaretRight size={16} weight="bold" color={colors.textTertiary} />
        </View>
      </Pressable>
    );
  }

  const title = status === 'expired' ? 'Seu Par-Q expirou' : 'Responda seu Par-Q';
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.head}>
        <ClipboardText size={14} weight="duotone" color={colors.textInverse} />
        <AppText variant="eyebrow" color="inverse">Par-Q</AppText>
      </View>
      <AppText variant="h3" color="inverse">{title}</AppText>
      <AppText variant="metaSmall" color="inverse">Responder Par-Q</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.neon,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    gap: 2,
  },
  cardMuted: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  mutedRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  mutedText: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: 2 },
}));
