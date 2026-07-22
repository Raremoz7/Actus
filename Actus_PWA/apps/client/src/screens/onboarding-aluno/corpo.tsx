// Peso e altura (puláveis — critério de aceite). Peso vai REAL (PATCH /me,
// body_weight_kg 20–400). Altura: [MOCK até o back ter campo]. Ao concluir OU pular,
// marca o onboarding como feito e entra na home.
import { useState } from 'react';
import { router } from '@/navigation';

import { Input } from '@/components/ui';
import { OnboardingScreen } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import { usePatchMe } from '@/hooks/usePatchMe';
import { saveStudentAnswers } from '@/mocks/studentOnboarding';
import { useOnboardingStore } from '@/store/onboardingStore';
import { homeForTipo } from '@/lib/authRoutes';

// "98,7" → 98.7 (aceita vírgula ou ponto); null se não numérico.
function parseDecimal(v: string): number | null {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export default function CorpoScreen() {
  const user = useAuthStore((s) => s.user);
  const patchMe = usePatchMe();
  const markDone = useOnboardingStore((s) => s.markDone);

  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [pesoError, setPesoError] = useState<string | null>(null);
  const [alturaError, setAlturaError] = useState<string | null>(null);

  async function finish() {
    if (!user) return;
    await markDone(user.id);
    router.replace(homeForTipo('aluno'));
  }

  async function save() {
    if (!user) return;
    setPesoError(null);
    setAlturaError(null);

    const kg = peso.trim() === '' ? null : parseDecimal(peso);
    const m = altura.trim() === '' ? null : parseDecimal(altura);

    if (peso.trim() !== '' && (kg === null || kg < 20 || kg > 400)) {
      setPesoError('Peso entre 20 e 400 kg.');
      return;
    }
    if (altura.trim() !== '' && (m === null || m < 1 || m > 2.5)) {
      setAlturaError('Altura entre 1,00 e 2,50 m.');
      return;
    }

    if (m !== null) {
      await saveStudentAnswers(user.id, { altura_cm: Math.round(m * 100) });
    }
    if (kg !== null) {
      patchMe.mutate(
        { body_weight_kg: kg },
        { onSuccess: () => void finish(), onError: () => void finish() },
      );
      return; // finish roda no callback (não bloqueia o aluno por erro de peso).
    }
    await finish();
  }

  return (
    <OnboardingScreen
      step={8}
      total={8}
      title="Seu corpo"
      subtitle="Ajuda seu personal a calibrar o treino. Você pode preencher depois."
      ctaLabel="Concluir"
      ctaLoading={patchMe.isPending}
      onCta={() => void save()}
      skipLabel="Pular por enquanto"
      onSkip={() => void finish()}
    >
      <Input
        label="Peso atual (kg)"
        value={peso}
        onChangeText={setPeso}
        keyboardType="decimal-pad"
        placeholder="98,7"
        error={pesoError ?? undefined}
      />
      <Input
        label="Altura (m)"
        value={altura}
        onChangeText={setAltura}
        keyboardType="decimal-pad"
        placeholder="1,98"
        error={alturaError ?? undefined}
      />
    </OnboardingScreen>
  );
}
