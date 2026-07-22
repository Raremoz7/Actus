import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { useUnseenBadges } from '@/hooks/useUnseenBadges';
import { darkTheme } from '@/theme';

import { BadgeUnlockQueue } from './BadgeUnlockQueue';

const { colors } = darkTheme;

// Feedback OFFLINE de conquista: ao abrir o app, detecta badges ainda não-vistos
// (que foram concedidos quando o overlay online não chegou a aparecer — ex.: o
// finish rodou em outra sessão) e exibe um banner in-app tocável sobre as tabs.
// Ao tocar, abre a fila de celebração (BadgeUnlockQueue), que marca cada badge
// como visto no servidor e, ao esgotar, faz o banner sumir naturalmente (a query
// `unseen` é invalidada pelo useMarkBadgesSeen).
export function UnseenBadgeWatcher() {
  const { data } = useUnseenBadges();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const badges = data?.badges ?? [];
  if (badges.length === 0) return null;

  // Fila aberta: o overlay (Modal) cobre a tela; ao concluir, volta ao banner
  // (que some sozinho assim que a lista de não-vistos zera após o markSeen).
  if (open) return <BadgeUnlockQueue badges={badges} onDone={() => setOpen(false)} />;

  return (
    <View style={[styles.wrap, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Você desbloqueou novas conquistas. Toque para ver."
        onPress={() => setOpen(true)}
        style={styles.banner}
      >
        <Trophy size={20} weight="duotone" color={colors.neon} />
        <AppText variant="bodySm" color="primary" style={styles.text}>
          Você desbloqueou novas conquistas! Toque para ver
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Camada flutuante que cobre as tabs sem capturar toques fora do banner.
  wrap: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 50,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface2,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.neon,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    // Sombra: banner flutuante (dropdown-like) — exceção permitida ao "sem sombra".
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { flex: 1 },
}));
