import { useState } from 'react';

import { useMarkBadgesSeen } from '@/hooks/useMarkBadgesSeen';
import type { Badge } from '@/types/gamification';

import { BadgeUnlockOverlay } from './BadgeUnlockOverlay';

type Props = {
  badges: Badge[];
  onDone?: () => void;
};

// Exibe os overlays de conquista em sequência (um por vez). A cada "Continuar"
// marca o badge como visto no servidor e avança para o próximo; ao esgotar a
// fila chama `onDone`. Não renderiza nada quando não há mais badges.
export function BadgeUnlockQueue({ badges, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const markSeen = useMarkBadgesSeen();

  const badge = badges[index];
  if (!badge) return null;

  return (
    <BadgeUnlockOverlay
      badge={badge}
      onContinue={() => {
        markSeen.mutate([badge.id]);
        if (index + 1 >= badges.length) onDone?.();
        setIndex((n) => n + 1);
      }}
    />
  );
}
