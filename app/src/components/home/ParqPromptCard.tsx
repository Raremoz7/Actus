import { Pressable, View } from 'react-native';
import { ClipboardText } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { shortDateBr } from '@/lib/format';
import type { ParqStatus } from '@/lib/parq';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  status: ParqStatus;
  validUntil?: string | null;
  onPress: () => void;
};

// Card do Par-Q na Home. Pendente/expirado → CTA. Em dia/atenção → estado discreto.
export function ParqPromptCard({ status, validUntil, onPress }: Props) {
  const pending = status === 'not_started' || status === 'expired';

  if (!pending) {
    const valid = validUntil ? `Em dia · válido até ${shortDateBr(validUntil)}` : 'Em dia';
    return (
      <View style={styles.cardMuted}>
        <View style={styles.head}>
          <ClipboardText size={14} weight="duotone" color={colors.textTertiary} />
          <AppText variant="eyebrow" color="tertiary">Par-Q</AppText>
        </View>
        <AppText variant="bodyMd" color="secondary">{valid}</AppText>
      </View>
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
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: 2 },
}));
