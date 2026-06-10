// PAR-Q como passo do onboarding (obrigatório). Reusa as perguntas, a linha de
// toggle e o mock persistido do Par-Q já entregue (src/mocks/parq.ts).
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { OnboardingScreen } from '@/components/onboarding';
import { ParqQuestionRow } from '@/components/parq';
import { useAuthStore } from '@/store/authStore';
import { submitParq } from '@/mocks/parq';
import { PARQ_QUESTIONS, type ParqAnswer, type ParqQuestionId } from '@/types/parq';

export default function ParqOnboardingScreen() {
  const user = useAuthStore((s) => s.user);
  const [values, setValues] = useState<Partial<Record<ParqQuestionId, boolean>>>({});
  const [saving, setSaving] = useState(false);

  const allAnswered = useMemo(
    () => PARQ_QUESTIONS.every((q) => typeof values[q.id] === 'boolean'),
    [values],
  );

  async function advance() {
    if (!allAnswered || !user || saving) return;
    setSaving(true);
    const answers: ParqAnswer[] = PARQ_QUESTIONS.map((q) => ({
      question_id: q.id,
      value: values[q.id] as boolean,
    }));
    try {
      await submitParq(user.id, answers);
      router.push('/onboarding-aluno/interesse');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScreen
      step={3}
      total={8}
      title="Antes de começar"
      subtitle="Sete perguntas rápidas sobre sua saúde — seu personal usa isso para montar treinos seguros."
      ctaLabel="Enviar respostas"
      ctaDisabled={!allAnswered || saving}
      ctaLoading={saving}
      onCta={() => void advance()}
    >
      <View>
        {PARQ_QUESTIONS.map((q) => (
          <ParqQuestionRow
            key={q.id}
            text={q.text}
            value={values[q.id] ?? null}
            onChange={(v) => setValues((prev) => ({ ...prev, [q.id]: v }))}
          />
        ))}
      </View>
    </OnboardingScreen>
  );
}
