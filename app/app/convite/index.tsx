// Gestão de convites do profissional (rota '/convite' — referenciada pelo botão
// neon do header da lista de Alunos). Lista os convites emitidos via GET /invites,
// com ações de compartilhar / copiar link / revogar (PATCH expires_at → agora;
// não há DELETE na API). Botão "Novo convite" leva a /convite/novo.

import { useEffect, useMemo } from 'react';
import { Alert, Platform, Pressable, Share, View } from 'react-native';
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
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, ListState } from '@/components/ui';
import { InviteCard } from '@/components/invite';
import { useInvites } from '@/hooks/useInvites';
import { useInviteActions } from '@/hooks/useInviteActions';
import {
  inviteDeepLink,
  inviteShareMessage,
  inviteExpiryLabel,
} from '@/lib/invite';
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
  const { revoke } = useInviteActions();

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

  async function handleCopy(code: string) {
    await copyText(inviteDeepLink(code));
  }

  function handleRevoke(id: string) {
    const message =
      'O link deixa de funcionar imediatamente. Esta ação não pode ser desfeita.';
    // react-native-web não suporta Alert com múltiplos botões → no web o
    // callback de "Revogar" nunca dispararia. Usa window.confirm como fallback.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Revogar convite\n\n${message}`)) {
        revoke.mutate(id);
      }
      return;
    }
    Alert.alert('Revogar convite', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Revogar', style: 'destructive', onPress: () => revoke.mutate(id) },
    ]);
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
