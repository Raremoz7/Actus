import { useState } from 'react';
import { router } from 'expo-router';
import type { z } from 'zod';

import { OnboardingScreen, OptionCard } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import {
  EXPERIENCIA_LABEL,
  ExperienciaSchema,
  saveStudentAnswers,
} from '@/mocks/studentOnboarding';

type Experiencia = z.infer<typeof ExperienciaSchema>;
const OPTIONS = ExperienciaSchema.options;

export default function ExperienciaScreen() {
  const user = useAuthStore((s) => s.user);
  const [value, setValue] = useState<Experiencia | null>(null);

  async function advance() {
    if (!value || !user) return;
    await saveStudentAnswers(user.id, { experiencia: value });
    router.push('/onboarding-aluno/frequencia');
  }

  return (
    <OnboardingScreen
      step={5}
      total={8}
      title="Qual seu nível de treino?"
      ctaLabel="Continuar"
      ctaDisabled={!value}
      onCta={() => void advance()}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt}
          label={EXPERIENCIA_LABEL[opt]}
          selected={value === opt}
          onPress={() => setValue(opt)}
        />
      ))}
    </OnboardingScreen>
  );
}
