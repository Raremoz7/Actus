import { Pressable, View } from 'react-native';
import { Flame, Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Tag } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// Status do desafio (espelha o backend) e do participante na lista /me/challenges.
type ChallengeStatus = 'draft' | 'active' | 'ended';
type ParticipantStatus = 'invited' | 'active';

// Teaser de ranking exibido no card ativo — só quando o ranking é público e o
// aluno já tem posição. Mantém o card presentational: a tela calcula e passa.
type RankingTeaser = { position: number; streak: number };

type Props = {
  name: string;
  // Progresso derivado das datas (starts_on..ends_on vs hoje LOCAL) — a lista não traz número.
  dayProgress: { day: number; total: number };
  status: ChallengeStatus;
  participantStatus: ParticipantStatus;
  // Rótulo de status pronto (challengeStatusLabel): 'Em breve' | 'Ativo' | 'Encerrado'.
  statusLabel: string;
  // Dias até começar — só > 0 quando o desafio ainda não iniciou ('Em breve').
  daysUntilStart?: number;
  // Posição/streak do próprio aluno quando o ranking é público (card ativo).
  rankingTeaser?: RankingTeaser | null;
  onPress: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  // Estado das mutations de convite — trava os botões durante a ação.
  accepting?: boolean;
  declining?: boolean;
};

// Razão dia/total clampada a [0, 1] para a largura da barra.
function progressRatio(day: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, day / total));
}

// Contagem regressiva curta para o início ('em 1 dia' / 'em 3 dias').
function countdownLabel(days: number): string {
  return days === 1 ? 'começa em 1 dia' : `começa em ${days} dias`;
}

export function ChallengeListCard({
  name,
  dayProgress,
  status,
  participantStatus,
  statusLabel,
  daysUntilStart = 0,
  rankingTeaser,
  onPress,
  onAccept,
  onDecline,
  accepting = false,
  declining = false,
}: Props) {
  const isInvited = participantStatus === 'invited';
  const ratio = progressRatio(dayProgress.day, dayProgress.total);
  const tagTone = status === 'active' ? 'active' : 'neutral';

  // Convite: card elevado + Trophy neon (destaque real, não só borda) + dois botões.
  if (isInvited) {
    return (
      <View style={[styles.card, styles.cardInvited]}>
        <View style={styles.head}>
          <Trophy size={16} weight="duotone" color={colors.neon} />
          <AppText variant="eyebrow" color="neon">
            Convite
          </AppText>
        </View>
        <AppText variant="h4" style={styles.name}>
          {name}
        </AppText>
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button
              variant="primary"
              label="Aceitar"
              onPress={() => onAccept?.()}
              loading={accepting}
              disabled={declining}
            />
          </View>
          <View style={styles.action}>
            <Button
              variant="ghost"
              label="Recusar"
              onPress={() => onDecline?.()}
              loading={declining}
              disabled={accepting}
            />
          </View>
        </View>
      </View>
    );
  }

  // Ativo/em breve/encerrado: card tocável com tag de status + barra de progresso.
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.headRow}>
        <View style={styles.head}>
          <Trophy size={14} weight="duotone" color={colors.textTertiary} />
          <AppText variant="eyebrow" color="tertiary">
            Desafio
          </AppText>
        </View>
        <Tag label={statusLabel} tone={tagTone} />
      </View>

      <AppText variant="h4" style={styles.name}>
        {name}
      </AppText>

      {status === 'draft' && daysUntilStart > 0 ? (
        <AppText variant="metaSmall" color="secondary" style={styles.countdown}>
          {countdownLabel(daysUntilStart)}
        </AppText>
      ) : (
        <>
          <View style={styles.progressRow}>
            <AppText variant="metaSmall" color="tertiary">
              {`dia ${dayProgress.day} de ${dayProgress.total}`}
            </AppText>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
          </View>
        </>
      )}

      {rankingTeaser ? (
        <View style={styles.teaser}>
          <AppText variant="metaSmall" color="tertiary">
            {`Você está em ${rankingTeaser.position}º`}
          </AppText>
          <View style={styles.teaserStreak}>
            {rankingTeaser.streak >= 1 && (
              <Flame testID="streak-flame" size={13} weight="duotone" color={colors.neon} />
            )}
            <AppText variant="metaSmall" color="secondary">
              {`${rankingTeaser.streak} de sequência`}
            </AppText>
          </View>
        </View>
      ) : null}
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
  // Convite: surface elevada + borda neon — destaque real (ação pendente do aluno).
  cardInvited: {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.neon,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  name: { marginTop: theme.spacing.xs },
  countdown: { marginTop: theme.spacing.sm },
  progressRow: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs },
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
  teaser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  teaserStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  action: { flex: 1 },
}));
