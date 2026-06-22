// O que o professor quer fazer primeiro (intenção; pulável). Telemetria de uso.
import { useState } from 'react';
import { router } from 'expo-router';
import type { z } from 'zod';

import { OnboardingScreen, OptionCard } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import {
  FORMA_USO_LABEL,
  FormaUsoSchema,
  saveProfessionalProfile,
} from '@/api/professionalProfile';

type FormaUso = z.infer<typeof FormaUsoSchema>;
const OPTIONS = FormaUsoSchema.options;
const NEXT = '/onboarding-professor/convite';

export default function FormaUsoScreen() {
  const user = useAuthStore((s) => s.user);
  const [value, setValue] = useState<FormaUso | null>(null);

  async function advance() {
    // Intenção é opcional/telemetria: grava se houver, nunca trava a navegação.
    if (value && user) {
      try {
        await saveProfessionalProfile({ forma_uso: value });
      } catch {
        // Segue mesmo se a rede falhar.
      }
    }
    router.push(NEXT);
  }

  return (
    <OnboardingScreen
      step={3}
      total={4}
      title="O que você quer fazer primeiro na Actus?"
      ctaLabel="Continuar"
      ctaDisabled={!value}
      onCta={() => void advance()}
      skipLabel="Pular"
      onSkip={() => router.push(NEXT)}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt}
          label={FORMA_USO_LABEL[opt]}
          selected={value === opt}
          onPress={() => setValue(opt)}
        />
      ))}
    </OnboardingScreen>
  );
}
