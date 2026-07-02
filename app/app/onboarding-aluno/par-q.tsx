// PAR-Q como passo do onboarding (obrigatório). Reusa as perguntas, a linha de
// toggle e a API real do Par-Q (useSubmitParq — ver app/(aluno)/par-q.tsx).
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { OnboardingScreen } from '@/components/onboarding';
import { ParqQuestionRow } from '@/components/parq';
import { AppText } from '@/components/ui';
import { useMe } from '@/hooks/useMe';
import { useSubmitParq } from '@/hooks/useParq';
import { PARQ_QUESTIONS, type ParqAnswer, type ParqQuestionId } from '@/types/parq';

export default function ParqOnboardingScreen() {
  const me = useMe();
  const studentId = me.data?.id;
  const submit = useSubmitParq();
  const [values, setValues] = useState<Partial<Record<ParqQuestionId, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const allAnswered = useMemo(
    () => PARQ_QUESTIONS.every((q) => typeof values[q.id] === 'boolean'),
    [values],
  );

  async function advance() {
    if (!allAnswered || !studentId || saving) return;
    setSaving(true);
    setSubmitError(null);
    const answers: ParqAnswer[] = PARQ_QUESTIONS.map((q) => ({
      question_id: q.id,
      value: values[q.id] as boolean,
    }));
    try {
      await submit.mutateAsync({ studentId, answers });
      router.push('/onboarding-aluno/interesse');
    } catch {
      setSubmitError('Não foi possível enviar suas respostas. Tente de novo.');
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
      canAdvance={allAnswered}
      invalidMessage="Responda todas as perguntas para continuar."
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
        {submitError ? (
          <AppText variant="bodySm" color="error">
            {submitError}
          </AppText>
        ) : null}
      </View>
    </OnboardingScreen>
  );
}
