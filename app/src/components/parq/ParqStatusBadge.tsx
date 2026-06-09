import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, type AppTextColor } from '@/components/ui';
import type { ParqStatus } from '@/lib/parq';

type Props = { status: ParqStatus };

// Texto/tom por status. `clear` não rende selo (reduz ruído na lista).
const LABEL: Record<Exclude<ParqStatus, 'clear'>, string> = {
  not_started: 'Par-Q pendente',
  attention: 'Atenção',
  expired: 'Par-Q expirado',
};
const TEXT: Record<Exclude<ParqStatus, 'clear'>, AppTextColor> = {
  not_started: 'secondary',
  attention: 'inverse',
  expired: 'secondary',
};

export function ParqStatusBadge({ status }: Props) {
  if (status === 'clear') return null;
  styles.useVariants({ status });
  return (
    <View style={styles.badge}>
      <AppText variant="eyebrow" color={TEXT[status]}>
        {LABEL[status]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.tag,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    variants: {
      status: {
        attention: { backgroundColor: theme.colors.warning },
        not_started: { backgroundColor: theme.colors.surface2 },
        expired: { backgroundColor: theme.colors.surface2 },
        clear: {},
      },
    },
  },
}));
