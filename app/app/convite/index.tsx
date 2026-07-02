// Gestão de convites do profissional (rota '/convite' — referenciada pelo botão
// neon do header da lista de Alunos). Lista os convites emitidos via GET /invites,
// com ações de compartilhar / copiar link / revogar (PATCH expires_at → agora;
// não há DELETE na API). Botão "Novo convite" leva a /convite/novo.

import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { CaretLeft, Plus, Ticket } from 'phosphor-react-native';
import { goBackOr } from '@/lib/nav';
import { copyText } from '@/lib/clipboard';
import { toast } from '@/store/toastStore';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, ConfirmDialog, ListState } from '@/components/ui';
import { InviteCard } from '@/components/invite';
import { useInvites } from '@/hooks/useInvites';
import { useInviteActions } from '@/hooks/useInviteActions';
import { inviteShareMessage, inviteExpiryLabel } from '@/lib/invite';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// "criado em DD/MM" a partir do created_at (TIMESTAMP ISO completo, com hora →
// new Date é seguro aqui; a regra anti-toISOString vale só p/ campos data-only).
function createdAtLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `criado em ${day}/${month}`;
}

export default function ConvitesScreen() {
  const list = useInvites();
  const { revoke, reactivate } = useInviteActions();
  // Id do convite pendente de confirmação de revogação (null = diálogo fechado).
  const [revokeId, setRevokeId] = useState<string | null>(null);

  // ÚNICA animação da tela: reveal de entrada (opacity + translateY, 300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  // Ordena por mais recente (created_at desc) sem mutar a fonte.
  const invites = useMemo(() => {
    const raw = list.data?.invites ?? [];
    return [...raw].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [list.data]);
  const isEmpty = !list.isLoading && !list.isError && invites.length === 0;

  function openNew() {
    router.push('/convite/novo' as Href);
  }

  async function handleShare(code: string) {
    try {
      await Share.share({ message: inviteShareMessage(code) });
    } catch {
      // Compartilhamento cancelado/indisponível — silencioso (não é erro de fluxo).
    }
  }

  // Copia só o CÓDIGO do convite (não o pseudolink) e confirma com toast. (TEC-69)
  async function handleCopy(code: string) {
    if (await copyText(code)) {
      toast('Código de convite copiado');
    }
  }

  // Abre o diálogo de confirmação do app (substitui o Alert nativo — que nem
  // renderiza os botões no web). A confirmação real acontece em confirmRevoke. (TEC-70)
  function handleRevoke(id: string) {
    setRevokeId(id);
  }

  function confirmRevoke() {
    if (!revokeId) return;
    revoke.mutate(revokeId, { onSettled: () => setRevokeId(null) });
  }

  // Reativa um convite inativo (um toque, validade padrão) e confirma com toast. (TEC-71)
  function handleReactivate(inv: {
    id: string;
    used_count: number;
    max_uses: number;
  }) {
    reactivate.mutate(
      { id: inv.id, usedCount: inv.used_count, maxUses: inv.max_uses },
      {
        onSuccess: () => toast('Convite reativado'),
        onError: () =>
          Alert.alert('Não foi possível reativar', 'Tente novamente em instantes.'),
      },
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => goBackOr()}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerText}>
          <AppText variant="eyebrow" color="tertiary">
            Gestão
          </AppText>
          <AppText variant="h2">Convites</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Novo convite"
          onPress={openNew}
          style={styles.newBtn}
        >
          <Plus size={22} weight="bold" color={colors.textInverse} />
        </Pressable>
      </View>

      <Animated.ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={revealStyle}>
          <View style={styles.list}>
            {invites.map((inv) => (
              <View key={inv.id} style={styles.item}>
                <InviteCard
                  code={inv.code}
                  active={inv.active}
                  usedCount={inv.used_count}
                  maxUses={inv.max_uses}
                  expiresAtLabel={inviteExpiryLabel(inv.expires_at)}
                  onShare={() => void handleShare(inv.code)}
                  onCopy={() => void handleCopy(inv.code)}
                  onRevoke={() => handleRevoke(inv.id)}
                  onReactivate={() => handleReactivate(inv)}
                />
                <AppText
                  variant="metaSmall"
                  color="tertiary"
                  style={styles.createdAt}
                >
                  {createdAtLabel(inv.created_at)}
                </AppText>
              </View>
            ))}
          </View>

          {list.isLoading ? <ListState kind="loading" skeletonCount={3} /> : null}

          {isEmpty ? (
            <ListState
              kind="empty"
              icon={Ticket}
              title="Nenhum convite ainda"
              message="Gere um link para vincular seu primeiro aluno"
              actionLabel="Novo convite"
              onAction={openNew}
            />
          ) : null}

          {list.isError ? (
            <ListState
              kind="error"
              title="Não foi possível carregar"
              message="Verifique sua conexão e tente novamente."
              actionLabel="Tentar de novo"
              onAction={() => void list.refetch()}
            />
          ) : null}
        </Animated.View>
      </Animated.ScrollView>

      <View style={styles.footer}>
        <Button variant="primary" label="Novo convite" onPress={openNew} />
      </View>

      <ConfirmDialog
        visible={revokeId !== null}
        title="Revogar convite"
        message="O link deixa de funcionar imediatamente. Esta ação não pode ser desfeita."
        confirmLabel="Revogar"
        tone="destructive"
        loading={revoke.isPending}
        onConfirm={confirmRevoke}
        onCancel={() => setRevokeId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  list: {
    gap: theme.spacing.md,
  },
  item: {
    gap: theme.spacing.xs,
  },
  createdAt: {
    paddingLeft: theme.spacing.xs,
  },
  note: {
    marginTop: theme.spacing.lg,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
}));
