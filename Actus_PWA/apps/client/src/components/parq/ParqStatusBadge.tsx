import { Tag, type TagTone } from '@/components/ui';
import type { ParqStatus } from '@/lib/parq';

type Props = { status: ParqStatus };

// Selo de status do Par-Q — mapper fino sobre o átomo Tag (radius 4).
// `clear` não rende selo (reduz ruído nas listas).
const LABEL: Record<Exclude<ParqStatus, 'clear'>, string> = {
  not_started: 'Par-Q pendente',
  attention: 'Atenção',
  expired: 'Par-Q expirado',
};
const TONE: Record<Exclude<ParqStatus, 'clear'>, TagTone> = {
  not_started: 'neutral',
  attention: 'warning',
  expired: 'neutral',
};

export function ParqStatusBadge({ status }: Props) {
  if (status === 'clear') return null;
  return <Tag label={LABEL[status]} tone={TONE[status]} />;
}
