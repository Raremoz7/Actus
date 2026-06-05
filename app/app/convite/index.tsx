// Gestão de convites do profissional (rota '/convite' — referenciada pelo botão
// neon do header da lista de Alunos). Lista os convites emitidos via GET /invites,
// com ações de compartilhar / copiar link / revogar (PATCH expires_at → agora;
// não há DELETE na API). Botão "Novo convite" leva a /convite/novo.

import { useEffect } from 'react';
import { Alert, Pressable, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { CaretLeft, Plus } from 'phosphor-react-native';
import * as Clipboard from 'expo-clipboard';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button } from '@/components/ui';
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

  const invites = list.data?.invites ?? [];
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
    await Clipboard.setStringAsync(inviteDeepLink(code));
  }

  function handleRevoke(id: string) {
    Alert.alert(
      'Revogar convite',
      'O link deixa de funcionar imediatamente. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: () => revoke.mutate(id),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => router.back()}
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
              <InviteCard
                key={inv.id}
                code={inv.code}
                active={inv.active}
                usedCount={inv.used_count}
                maxUses={inv.max_uses}
                expiresAtLabel={inviteExpiryLabel(inv.expires_at)}
                onShare={() => void handleShare(inv.code)}
                onCopy={() => void handleCopy(inv.code)}
                onRevoke={() => handleRevoke(inv.id)}
              />
            ))}
          </View>

          {list.isLoading ? (
            <AppText variant="bodySm" color="tertiary" style={styles.note}>
              Carregando…
            </AppText>
          ) : null}

          {isEmpty ? (
            <AppText variant="bodySm" color="tertiary" style={styles.note}>
              Nenhum convite ainda.
            </AppText>
          ) : null}

          {list.isError ? (
            <AppText variant="bodySm" color="tertiary" style={styles.note}>
              Não foi possível carregar agora.
            </AppText>
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
  note: {
    marginTop: theme.spacing.lg,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
}));
