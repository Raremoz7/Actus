import { Pressable, View } from 'react-native';
import { ShareNetwork, Copy, Trash, ArrowClockwise } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  code: string;
  active: boolean;
  usedCount: number;
  maxUses: number;
  // Rótulo de validade já formatado pelo chamador (ex.: "expira em 7 dias").
  expiresAtLabel: string;
  onShare: () => void;
  onCopy: () => void;
  // Revogar = PATCH expires_at para agora (não há DELETE na API). Só faz sentido enquanto ativo.
  onRevoke: () => void;
  // Reativar (PATCH validade/usos) — só faz sentido enquanto inativo.
  onReactivate: () => void;
};

export function InviteCard({
  code,
  active,
  usedCount,
  maxUses,
  expiresAtLabel,
  onShare,
  onCopy,
  onRevoke,
  onReactivate,
}: Props) {
  styles.useVariants({ active });

  const usesLabel = `${usedCount} / ${maxUses} ${maxUses === 1 ? 'uso' : 'usos'}`;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <AppText variant="dataMed" color="neon" style={styles.code}>
          {code}
        </AppText>
        <View style={styles.chip}>
          <AppText variant="eyebrow" color={active ? 'inverse' : 'tertiary'}>
            {active ? 'Ativo' : 'Inativo'}
          </AppText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <AppText variant="metaSmall" color="secondary">
          {usesLabel}
        </AppText>
        <AppText variant="metaSmall" color="tertiary">
          {expiresAtLabel}
        </AppText>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compartilhar convite"
          style={styles.iconButton}
          onPress={onShare}
        >
          <ShareNetwork size={18} weight="duotone" color={colors.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copiar código do convite"
          style={styles.iconButton}
          onPress={onCopy}
        >
          <Copy size={18} weight="duotone" color={colors.textSecondary} />
        </Pressable>
        {active ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Revogar convite"
            style={styles.iconButton}
            onPress={onRevoke}
          >
            <Trash size={18} weight="duotone" color={colors.error} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reativar convite"
            style={styles.reactivate}
            onPress={onReactivate}
          >
            <ArrowClockwise size={18} weight="duotone" color={colors.success} />
            <AppText variant="label" color="success">
              Reativar
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  code: {
    flexShrink: 1,
    letterSpacing: 2,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.tag,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    variants: {
      active: {
        // ativo: fundo secondary (verde) com texto inverse; inativo: surface neutro.
        true: { backgroundColor: theme.colors.secondary },
        false: { backgroundColor: theme.colors.surface2 },
      },
    },
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Ação de reativar (convite inativo): pill com rótulo, ocupa o espaço restante.
  reactivate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
}));
