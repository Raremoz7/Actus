import { router } from 'expo-router';

import { FotoStep } from '@/components/onboarding';

export default function FotoAlunoScreen() {
  return (
    <FotoStep
      step={1}
      total={8}
      subtitle="Seu personal reconhece você com mais facilidade."
      onAdvance={() => router.push('/onboarding-aluno/vinculo')}
    />
  );
}
