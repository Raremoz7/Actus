import { useState } from 'react';
import { router } from 'expo-router';
import type { z } from 'zod';

import { OnboardingScreen, OptionCard } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import {
  LOCAL_LABEL,
  LocalTreinoSchema,
  saveStudentAnswers,
} from '@/mocks/studentOnboarding';

type Local = z.infer<typeof LocalTreinoSchema>;
const OPTIONS = LocalTreinoSchema.options;

export default function LocalScreen() {
  const user = useAuthStore((s) => s.user);
  const [value, setValue] = useState<Local | null>(null);

  async function advance() {
    if (!value || !user) return;
    await saveStudentAnswers(user.id, { local: value });
    router.push('/onboarding-aluno/corpo');
  }

  return (
    <OnboardingScreen
      step={7}
      total={8}
      title="Onde você treina?"
      ctaLabel="Continuar"
      canAdvance={value !== null}
      invalidMessage="Escolha uma opção para continuar."
      onCta={() => void advance()}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt}
          label={LOCAL_LABEL[opt]}
          selected={value === opt}
          onPress={() => setValue(opt)}
        />
      ))}
    </OnboardingScreen>
  );
}
