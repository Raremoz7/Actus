import { router } from 'expo-router';

import { FotoStep } from '@/components/onboarding';

export default function FotoProfessorScreen() {
  return (
    <FotoStep
      step={1}
      total={4}
      subtitle="Adicione uma foto para seus alunos reconhecerem você com mais facilidade."
      onAdvance={() => router.push('/onboarding-professor/perfil')}
    />
  );
}
