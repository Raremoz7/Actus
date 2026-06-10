// Preferências do onboarding do aluno (interesse, experiência, dias, local, altura).
// [MOCK até o back expor — mesma limitação dev-only do Par-Q, documentada no spec]
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import {
  EXPERIENCIA_LABEL,
  INTERESSE_LABEL,
  LOCAL_LABEL,
  useStudentAnswers,
} from '@/mocks/studentOnboarding';

type Props = { studentId: string };

export function PreferencesSection({ studentId }: Props) {
  const answers = useStudentAnswers(studentId);
  if (!answers || Object.keys(answers).length === 0) return null;

  const rows: Array<{ label: string; value: string }> = [];
  if (answers.interesse)
    rows.push({ label: 'Interesse', value: INTERESSE_LABEL[answers.interesse] });
  if (answers.experiencia)
    rows.push({ label: 'Experiência', value: EXPERIENCIA_LABEL[answers.experiencia] });
  if (answers.dias_semana)
    rows.push({ label: 'Dias por semana', value: answers.dias_semana });
  if (answers.local) rows.push({ label: 'Local de treino', value: LOCAL_LABEL[answers.local] });
  if (answers.altura_cm)
    rows.push({ label: 'Altura', value: `${(answers.altura_cm / 100).toFixed(2)} m` });
  if (rows.length === 0) return null;

  return (
    <View style={styles.section}>
      <AppText variant="label" color="secondary">
        Preferências
      </AppText>
      <View style={styles.list}>
        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <AppText variant="bodySm" color="tertiary" style={styles.rowLabel}>
              {r.label}
            </AppText>
            <AppText variant="bodySm" color="secondary">
              {r.value}
            </AppText>
          </View>
        ))}
      </View>
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
  list: { gap: theme.spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm },
  rowLabel: { flexShrink: 0 },
}));
