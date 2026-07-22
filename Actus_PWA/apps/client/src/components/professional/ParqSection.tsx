import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Tag } from '@/components/ui';
import { ParqStatusBadge } from '@/components/parq';
import { useParqSubmission } from '@/hooks/useParq';
import { parqStatus } from '@/lib/parq';
import { shortDateBr } from '@/lib/format';
import { PARQ_QUESTIONS } from '@/types/parq';

type Props = { studentId: string };

// Seção read-only "Prontidão (Par-Q)" no detalhe do aluno. Sem dado → aguardando.
export function ParqSection({ studentId }: Props) {
  const sub = useParqSubmission(studentId);
  const status = parqStatus(sub, new Date());

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <AppText variant="label" color="secondary">Prontidão (Par-Q)</AppText>
        <ParqStatusBadge status={status} />
      </View>

      {!sub ? (
        <>
          <AppText variant="bodyMd" color="tertiary">Aguardando resposta do aluno.</AppText>
          {/* [fluxo futuro: push] Lembrete ao aluno — linha informativa, sem navegação morta
              (mesma convenção do AccountScreen para recursos ainda sem API). */}
          <View style={styles.remind}>
            <AppText variant="label" color="tertiary">Lembrar aluno</AppText>
            <Tag label="em breve" />
          </View>
        </>
      ) : (
        <>
          <AppText variant="metaSmall" color="tertiary">
            Respondido em {shortDateBr(sub.answered_at)} · válido até {shortDateBr(sub.valid_until)}
          </AppText>
          <View style={styles.list}>
            {PARQ_QUESTIONS.map((q) => {
              const yes = sub.answers.find((a) => a.question_id === q.id)?.value === true;
              return (
                <View key={q.id} style={styles.row}>
                  <AppText variant="bodySm" color="secondary" style={styles.q}>{q.text}</AppText>
                  <AppText variant="label" color={yes ? 'error' : 'tertiary'}>{yes ? 'Sim' : 'Não'}</AppText>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  list: { gap: theme.spacing.sm, marginTop: theme.spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  q: { flex: 1 },
}));
