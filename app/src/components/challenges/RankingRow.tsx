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
};

// O ranking é ordenado por streak (sequência dentro do desafio) e desempata por
// dias ativos. Por isso o número em destaque é o STREAK (com chama); os dias
// ativos aparecem como métrica secundária.
export function RankingRow({ position, name, activeDays, streak, isMe }: Props) {
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <AppText variant="dataMed" color={isMe ? 'neon' : 'secondary'} style={styles.position}>
        {String(position)}
      </AppText>
      <AppText
        variant="bodyMd"
        color={isMe ? 'neon' : 'primary'}
        numberOfLines={1}
        style={styles.name}
      >
        {isMe ? 'Você' : name}
      </AppText>
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
  name: {
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
