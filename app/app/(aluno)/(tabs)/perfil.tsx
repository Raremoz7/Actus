import { AccountScreen } from '@/components/account/AccountScreen';

// Streak (weekly-overview) só existe para aluno → showStreak.
export default function AlunoPerfilScreen() {
  return <AccountScreen showStreak />;
}
