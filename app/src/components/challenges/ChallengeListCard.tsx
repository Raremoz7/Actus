import { Pressable, View } from 'react-native';
import { Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// Status do desafio (espelha o backend) e do participante na lista /me/challenges.
type ChallengeStatus = 'draft' | 'active' | 'ended';
type ParticipantStatus = 'invited' | 'active';

type Props = {
  name: string;
  // Progresso derivado das datas (starts_on..ends_on vs hoje LOCAL) — a lista não traz número.
  dayProgress: { day: number; total: number };
  status: ChallengeStatus;
  participantStatus: ParticipantStatus;
  onPress: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
};

// Razão dia/total clampada a [0, 1] para a largura da barra.
function progressRatio(day: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, day / total));
}

export function ChallengeListCard({
  name,
  dayProgress,
  participantStatus,
  onPress,
  onAccept,
  onDecline,
}: Props) {
  const isInvited = participantStatus === 'invited';
  const ratio = progressRatio(dayProgress.day, dayProgress.total);

  // Cabeçalho comum (eyebrow + nome).
  const header = (
    <>
      <View style={styles.head}>
        <Trophy size={14} weight="duotone" color={colors.textTertiary} />
        <AppText variant="eyebrow" color="tertiary">
          Desafio
        </AppText>
      </View>
      <AppText variant="h3" style={styles.name}>
        {name}
      </AppText>
    </>
  );

  // Convite: destaque (borda warning) + dois botões, sem barra de progresso.
  if (isInvited) {
    return (
      <View style={[styles.card, styles.cardInvited]}>
        {header}
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button variant="primary" label="Aceitar" onPress={() => onAccept?.()} />
          </View>
          <View style={styles.action}>
            <Button variant="ghost" label="Recusar" onPress={() => onDecline?.()} />
          </View>
        </View>
      </View>
    );
  }

  // Ativo: card tocável com barra de progresso "dia X de Y".
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      {header}
      <View style={styles.progressRow}>
        <AppText variant="metaSmall" color="tertiary">
          {`dia ${dayProgress.day} de ${dayProgress.total}`}
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  cardInvited: {
    borderColor: theme.colors.warning,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  name: { marginTop: theme.spacing.xs },
  progressRow: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.xs },
  track: {
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  action: { flex: 1 },
}));
