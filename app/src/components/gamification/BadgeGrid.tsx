import { View } from 'react-native';
import { Lock, Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import type { Badge } from '@/types/gamification';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  badges: Badge[];
};

// Grid de conquistas: cada badge aparece como ilustração (placeholder circular até as
// artes Lottie chegarem) + nome. Os bloqueados ficam esmaecidos com um cadeado sobreposto.
// O nome aparece SEMPRE (conquistado ou não) — o aluno vê o que ainda pode alcançar.
export function BadgeGrid({ badges }: Props) {
  return (
    <View style={styles.grid}>
      {badges.map((badge) => {
        const earned = badge.earned === true;
        return (
          <View
            key={badge.id}
            style={styles.item}
            testID={earned ? `badge-${badge.id}` : `badge-${badge.id}-locked`}
          >
            <View style={[styles.medallion, !earned && styles.medallionLocked]}>
              {earned ? (
                <Trophy size={28} weight="duotone" color={colors.neon} />
              ) : (
                <Lock size={24} weight="duotone" color={colors.textTertiary} />
              )}
            </View>
            <AppText
              variant="metaSmall"
              color={earned ? 'secondary' : 'tertiary'}
              numberOfLines={2}
              style={styles.name}
            >
              {badge.name}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  // 3 colunas com gaps — largura proporcional para acomodar telas estreitas.
  item: {
    width: '30%',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  medallion: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bloqueado: esmaecido, sem o acento neon.
  medallionLocked: {
    opacity: 0.45,
    backgroundColor: theme.colors.surface1,
  },
  name: {
    textAlign: 'center',
  },
}));
