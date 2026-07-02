import { useState } from 'react';
import { router } from 'expo-router';
import type { z } from 'zod';

import { OnboardingScreen, OptionCard } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import {
  INTERESSE_LABEL,
  InteresseSchema,
  saveStudentAnswers,
} from '@/mocks/studentOnboarding';

type Interesse = z.infer<typeof InteresseSchema>;
const OPTIONS = InteresseSchema.options;

export default function InteresseScreen() {
  const user = useAuthStore((s) => s.user);
  const [value, setValue] = useState<Interesse | null>(null);

  async function advance() {
    if (!value || !user) return;
    await saveStudentAnswers(user.id, { interesse: value });
    router.push('/onboarding-aluno/experiencia');
  }

  return (
    <OnboardingScreen
      step={4}
      total={8}
      title="Qual seu principal interesse com o treino?"
      ctaLabel="Continuar"
      canAdvance={value !== null}
      invalidMessage="Escolha uma opção para continuar."
      onCta={() => void advance()}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt}
          label={INTERESSE_LABEL[opt]}
          selected={value === opt}
          onPress={() => setValue(opt)}
        />
      ))}
    </OnboardingScreen>
  );
}
