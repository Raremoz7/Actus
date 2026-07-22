import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { StudentRow } from '@/components/professional';
import type { Student } from '@/types/professional';

type Props = {
  students: Student[];
  onOpen: (id: string) => void;
  limit?: number;
};

// Nome exibido: full_name quando há, senão e-mail (mesmo critério das telas pro).
function displayName(s: Student): string {
  const n = s.full_name?.trim();
  return n && n.length > 0 ? n : s.email;
}

// Ordena por vínculo mais recente (linked_at desc) sem depender da ordem da API.
function byLinkedDesc(a: Student, b: Student): number {
  if (a.linked_at === b.linked_at) return 0;
  return a.linked_at < b.linked_at ? 1 : -1;
}

// Bloco "Alunos recentes": os N alunos vinculados mais recentemente.
export function RecentStudents({ students, onOpen, limit = 4 }: Props) {
  const recent = [...students].sort(byLinkedDesc).slice(0, limit);

  return (
    <View style={styles.wrap}>
      <AppText variant="label" color="secondary">
        Alunos recentes
      </AppText>
      {recent.length === 0 ? (
        <AppText variant="bodySm" color="tertiary">
          Nenhum aluno ainda.
        </AppText>
      ) : (
        <View style={styles.list}>
          {recent.map((s) => (
            <StudentRow
              key={s.id}
              name={displayName(s)}
              subtitle={s.email}
              onPress={() => onOpen(s.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: { gap: theme.spacing.sm },
  list: { gap: theme.spacing.xs },
}));
