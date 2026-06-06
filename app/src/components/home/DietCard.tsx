import { Pressable, View } from 'react-native';
import { ForkKnife } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// onPress é opcional: sem tela de dieta do aluno (builder é do nutri), o card
// fica informativo em vez de navegar para o lugar errado.
type Props = { title: string; nextMealTime: string | null; onPress?: () => void };

export function DietCard({ title, nextMealTime, onPress }: Props) {
  const inner = (
    <>
      <View style={styles.head}>
        <ForkKnife size={14} weight="duotone" color={colors.textTertiary} />
        <AppText variant="eyebrow" color="tertiary">
          Dieta
        </AppText>
      </View>
      <AppText variant="h3" style={styles.name}>
        {title}
      </AppText>
      {nextMealTime ? (
        <AppText variant="metaSmall" color="tertiary">
          {nextMealTime}
        </AppText>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.card}>{inner}</View>;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  name: { marginTop: theme.spacing.xs, marginBottom: 2 },
}));
