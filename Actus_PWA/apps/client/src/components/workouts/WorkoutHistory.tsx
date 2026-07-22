import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { shortDateBr } from '@/lib/format';

type RecentSession = {
  id: string;
  scheduled_for_date: string;
  status: string;
  started_at: string;
  completed_at: string | null;
};

// Rótulo PT do status da sessão (campo livre da API).
function statusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'concluído';
    case 'in_progress':
      return 'em andamento';
    case 'abandoned':
      return 'abandonado';
    default:
      return status;
  }
}

type Props = { sessions: RecentSession[] };

// Histórico do treino a partir de recent_sessions: resumo ("X vezes · última em <data>")
// + linhas por sessão (data · status). Some quando não há sessões.
export function WorkoutHistory({ sessions }: Props) {
  if (sessions.length === 0) return null;

  // Mais recente primeiro, por scheduled_for_date (date-only, compara como string ISO).
  const ordered = [...sessions].sort((a, b) =>
    b.scheduled_for_date.localeCompare(a.scheduled_for_date),
  );
  const latest = ordered[0]!;
  const times = sessions.length;
  const summary = `${times} ${times === 1 ? 'vez' : 'vezes'} · última em ${shortDateBr(latest.scheduled_for_date)}`;

  return (
    <View>
      <AppText variant="eyebrow" color="tertiary" style={styles.label}>
        Histórico
      </AppText>
      <View style={styles.card}>
        <AppText variant="bodySm" color="secondary">
          {summary}
        </AppText>
        <View style={styles.list}>
          {ordered.slice(0, 5).map((s) => (
            <View key={s.id} style={styles.row}>
              <AppText variant="metaSmall" color="tertiary">
                {shortDateBr(s.scheduled_for_date)}
              </AppText>
              <AppText variant="metaSmall" color="tertiary">
                {statusLabel(s.status)}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  label: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  card: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  list: { marginTop: theme.spacing.sm, gap: theme.spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));
