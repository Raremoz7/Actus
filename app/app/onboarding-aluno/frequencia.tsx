import { useState } from 'react';
import { router } from 'expo-router';
import type { z } from 'zod';

import { OnboardingScreen, OptionCard } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import { DiasSemanaSchema, saveStudentAnswers } from '@/mocks/studentOnboarding';

type Dias = z.infer<typeof DiasSemanaSchema>;
const OPTIONS = DiasSemanaSchema.options;

// O próprio valor já é o rótulo ('1'…'5+').
export default function FrequenciaScreen() {
  const user = useAuthStore((s) => s.user);
  const [value, setValue] = useState<Dias | null>(null);

  async function advance() {
    if (!value || !user) return;
    await saveStudentAnswers(user.id, { dias_semana: value });
    router.push('/onboarding-aluno/local');
  }

  return (
    <OnboardingScreen
      step={6}
      total={8}
      title="Quantos dias por semana você quer treinar?"
      ctaLabel="Continuar"
      ctaDisabled={!value}
      onCta={() => void advance()}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt}
          label={opt}
          selected={value === opt}
          onPress={() => setValue(opt)}
        />
      ))}
    </OnboardingScreen>
  );
}
