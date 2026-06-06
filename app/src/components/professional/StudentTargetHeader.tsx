import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { studentInitials } from './StudentRow';

type Props = {
  // Nome do aluno-alvo (resolvido do cache de useStudents). null enquanto desconhecido.
  name: string | null;
  // E-mail do aluno — subtítulo discreto.
  email?: string | null;
};

// Cabeçalho do aluno-alvo nas telas de atribuição: avatar com iniciais + nome + e-mail.
// Deixa explícito PARA QUEM o treino/dieta vai (o id chega por param; o nome vem do cache).
// Quando o aluno não está no cache (deep link), some — a tela ainda funciona pelo id.
export function StudentTargetHeader({ name, email }: Props) {
  if (!name) return null;
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <AppText variant="label" color="neon">
          {studentInitials(name)}
        </AppText>
      </View>
      <View style={styles.text}>
        <AppText variant="bodyMd" numberOfLines={1}>
          {name}
        </AppText>
        {email ? (
          <AppText variant="metaSmall" color="tertiary" numberOfLines={1}>
            {email}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
}));
