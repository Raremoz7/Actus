import { AnimatedPage } from '@/components/ui';
import { AccountScreen } from '@/components/account/AccountScreen';

// Streak (weekly-overview) só existe para aluno → showStreak.
export default function AlunoPerfilScreen() {
  return <AnimatedPage><AccountScreen showStreak /></AnimatedPage>;
}
