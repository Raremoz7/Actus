import { View } from 'react-native';
import { Flame } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  position: number;
  name: string;
  activeDays: number;
  streak: number;
  isMe: boolean;
  // Melhor sequência DENTRO do desafio — exibida como recorde na própria linha.
  streakBest?: number;
  // Última atividade no intervalo (YYYY-MM-DD) → rótulo relativo ('hoje'/'há 3 dias').
  lastActivityDate?: string | null;
  // Hoje LOCAL (YYYY-MM-DD) — a tela passa para evitar new Date() por linha.
  today?: string;
};

// Converte 'YYYY-MM-DD' em número ordinal de dias (UTC puro só p/ contar, não exibir).
// Retorna NaN se a string não casar o formato (defensivo contra dado malformado).
function dayNumber(dateOnly: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!m) return NaN;
  return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000);
}

// Rótulo relativo curto da última atividade ('ativo hoje' / 'ontem' / 'há N dias').
function lastActivityLabel(lastActivityDate: string, today: string): string | null {
  const diff = dayNumber(today) - dayNumber(lastActivityDate);
  if (Number.isNaN(diff) || diff < 0) return null;
  if (diff === 0) return 'ativo hoje';
  if (diff === 1) return 'ativo ontem';
  return `há ${diff} dias`;
}

// O ranking é ordenado por streak (sequência dentro do desafio) e desempata por
// dias ativos. Por isso o número em destaque é o STREAK (com chama); os dias
// ativos aparecem como métrica secundária. Para a própria linha (isMe) mostramos
// também recorde de sequência e última atividade.
export function RankingRow({
  position,
  name,
  activeDays,
  streak,
  isMe,
  streakBest,
  lastActivityDate,
  today,
}: Props) {
  const recordLabel =
    isMe && streakBest != null && streakBest > 0 ? `recorde: ${streakBest} dias` : null;
  const activityLabel =
    isMe && lastActivityDate && today ? lastActivityLabel(lastActivityDate, today) : null;
  const subline = [recordLabel, activityLabel].filter(Boolean).join(' · ');

  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <AppText variant="dataMed" color={isMe ? 'neon' : 'secondary'} style={styles.position}>
        {String(position)}
      </AppText>
      <View style={styles.identity}>
        <AppText
          variant="bodyMd"
          color={isMe ? 'neon' : 'primary'}
          numberOfLines={1}
        >
          {isMe ? 'Você' : name}
        </AppText>
        {subline ? (
          <AppText variant="metaSmall" color="tertiary" numberOfLines={1}>
            {subline}
          </AppText>
        ) : null}
      </View>
      <View style={styles.metrics}>
        <View style={styles.streak}>
          <Flame size={15} weight="duotone" color={isMe ? colors.neon : colors.secondary} />
          <AppText variant="dataMed" color={isMe ? 'neon' : 'secondary'}>
            {String(streak)}
          </AppText>
        </View>
        <AppText variant="metaSmall" color="tertiary">
          {`${activeDays}d ativos`}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.card,
  },
  // Destaque do próprio usuário: surface elevada + acento neon à esquerda.
  rowMe: {
    backgroundColor: theme.colors.surface3,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.neon,
  },
  position: {
    minWidth: 28,
  },
  identity: {
    flex: 1,
  },
  metrics: {
    alignItems: 'flex-end',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
}));
