import { Pressable, View } from 'react-native';
import { CaretRight, User } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  name: string;
  // Subtítulo mono (e-mail do aluno) — a API não fornece status/atividade.
  subtitle: string;
  onPress: () => void;
};

// Iniciais do nome para o avatar placeholder: 1ª letra dos dois primeiros tokens.
// Cai para '·' quando o nome está vazio.
export function studentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
}

// Linha densa de aluno: avatar com ícone (User duotone) + nome + e-mail mono + chevron.
// Sem ponto de status — a lista não traz atividade.
export function StudentRow({ name, subtitle, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.avatar}>
        <User size={22} weight="duotone" color={colors.neon} />
      </View>
      <View style={styles.text}>
        <AppText variant="bodyMd" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="metaSmall" color="tertiary" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <CaretRight size={16} weight="bold" color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
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
