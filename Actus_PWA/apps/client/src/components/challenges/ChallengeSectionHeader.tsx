import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';

type Props = {
  // Eyebrow da seção (ex.: 'Aguardando sua resposta', 'Em andamento').
  label: string;
  // Contagem opcional à direita (nº de itens da seção).
  count?: number;
};

// Cabeçalho de seção da lista de desafios — separa convites de ativos.
export function ChallengeSectionHeader({ label, count }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="eyebrow" color="tertiary">
        {label}
      </AppText>
      {count != null ? (
        <AppText variant="eyebrow" color="tertiary">
          {String(count)}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
}));
