import { View } from 'react-native';
import { Flame, Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// Dados do próprio aluno no desafio (linha do ranking onde student_id === me).
type MyStanding = {
  position: number;
  streakCurrent: number;
  activeDays: number;
  streakBest: number;
  lastActivityDate: string | null;
};

type Props = {
  // Standing quando o ranking é público e o aluno aparece nele.
  standing?: MyStanding | null;
  // true quando o ranking é PRIVADO (403 por visibilidade) — mostra intenção, não vazio.
  isPrivate?: boolean;
  // Hoje LOCAL (YYYY-MM-DD) para o rótulo relativo de última atividade.
  today: string;
};

function dayNumber(dateOnly: string): number {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return Math.floor(Date.UTC(y!, m! - 1, d!) / 86_400_000);
}

function lastActivityLabel(lastActivityDate: string, today: string): string {
  const diff = dayNumber(today) - dayNumber(lastActivityDate);
  if (diff < 0) return 'sem registro';
  if (diff === 0) return 'ativo hoje';
  if (diff === 1) return 'ativo ontem';
  return `há ${diff} dias`;
}

// Bloco ancorado "Sua posição" — entre o hero e a lista, surface elevada + acento neon.
// Concentra o progresso pessoal do aluno: posição, sequência atual, dias ativos,
// recorde de sequência e última atividade. Quando o ranking é privado, troca a
// posição por uma linha de intenção (o progresso pessoal segue visível se houver).
export function MyPositionCard({ standing, isPrivate = false, today }: Props) {
  const recordLabel =
    standing && standing.streakBest > 0 ? `seu recorde: ${standing.streakBest} dias` : null;
  const activityLabel =
    standing && standing.lastActivityDate
      ? lastActivityLabel(standing.lastActivityDate, today)
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Trophy size={14} weight="duotone" color={colors.neon} />
        <AppText variant="eyebrow" color="neon">
          Sua posição
        </AppText>
      </View>

      {standing ? (
        <>
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <AppText variant="dataBig" color="neon">
                {`${standing.position}º`}
              </AppText>
              <AppText variant="metaSmall" color="tertiary">
                no ranking
              </AppText>
            </View>
            <View style={styles.metric}>
              <View style={styles.streak}>
                {standing.streakCurrent >= 1 && (
                  <Flame testID="streak-flame" size={18} weight="duotone" color={colors.neon} />
                )}
                <AppText variant="dataBig" color="primary">
                  {String(standing.streakCurrent)}
                </AppText>
              </View>
              <AppText variant="metaSmall" color="tertiary">
                sequência
              </AppText>
            </View>
            <View style={styles.metric}>
              <AppText variant="dataBig" color="primary">
                {String(standing.activeDays)}
              </AppText>
              <AppText variant="metaSmall" color="tertiary">
                dias ativos
              </AppText>
            </View>
          </View>
          {recordLabel || activityLabel ? (
            <AppText variant="metaSmall" color="secondary" style={styles.subline}>
              {[recordLabel, activityLabel].filter(Boolean).join(' · ')}
            </AppText>
          ) : null}
        </>
      ) : isPrivate ? (
        <AppText variant="bodySm" color="secondary" style={styles.intent}>
          Este desafio tem ranking privado. Treine todo dia para somar dias e
          sequência — quem mais mantém o ritmo lidera.
        </AppText>
      ) : (
        <AppText variant="bodySm" color="secondary" style={styles.intent}>
          Você ainda não tem registro neste desafio. Conclua um treino para entrar
          no ranking.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.neon,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  metric: { alignItems: 'flex-start' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  subline: { marginTop: theme.spacing.md },
  intent: { marginTop: theme.spacing.sm },
}));
