// app/(aluno)/par-q.tsx
// Par-Q do aluno — lista única (scroll) com 7 toggles Sim/Não. O envio só habilita
// com as 7 respondidas. Persistência via mock store (sem endpoint na API v1).
// Com submissão anterior, a tela abre em modo REVISÃO (respostas pré-preenchidas).
// 1 momento de motion por tela: reveal de entrada.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button } from '@/components/ui';
import { ParqQuestionRow } from '@/components/parq';
import { useMe } from '@/hooks/useMe';
import { submitParq, useParqSubmission } from '@/mocks/parq';
import { deriveAnyYes } from '@/lib/parq';
import { goBackOr } from '@/lib/nav';
import { PARQ_QUESTIONS, type ParqAnswer, type ParqQuestionId } from '@/types/parq';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// Fallback de navegação: home do aluno (nunca '/', que é ambígua — ver authRoutes).
const HOME_ALUNO = '/(aluno)/(tabs)';

export default function ParqScreen() {
  const me = useMe();
  const studentId = me.data?.id;
  const existing = useParqSubmission(studentId);

  const [values, setValues] = useState<Partial<Record<ParqQuestionId, boolean>>>({});
  const [done, setDone] = useState(false);
  const [doneAnyYes, setDoneAnyYes] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modo revisão: pré-preenche com a submissão anterior, no máximo uma vez e só
  // enquanto o aluno ainda não tocou em nada (a hidratação do store é assíncrona).
  const isReview = existing !== null;
  const seeded = useRef(false);
  useEffect(() => {
    if (!existing || seeded.current) return;
    seeded.current = true;
    setValues((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const next: Partial<Record<ParqQuestionId, boolean>> = {};
      for (const a of existing.answers) {
        next[a.question_id as ParqQuestionId] = a.value;
      }
      return next;
    });
  }, [existing]);

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const allAnswered = useMemo(
    () => PARQ_QUESTIONS.every((q) => typeof values[q.id] === 'boolean'),
    [values],
  );

  function setAnswer(id: ParqQuestionId, value: boolean) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  async function onSubmit() {
    if (!allAnswered || !studentId || saving) return;
    setSaving(true);
    const answers: ParqAnswer[] = PARQ_QUESTIONS.map((q) => ({
      question_id: q.id,
      value: values[q.id] as boolean,
    }));
    try {
      await submitParq(studentId, answers);
      setDoneAnyYes(deriveAnyYes(answers));
      setDone(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => goBackOr(HOME_ALUNO)}
          hitSlop={12}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        {done ? (
          <View style={styles.doneWrap}>
            <AppText variant="eyebrow" color="neon">PAR-Q · ENVIADO</AppText>
            <AppText variant="h2" style={styles.doneTitle}>Respostas registradas</AppText>
            {doneAnyYes ? (
              <AppText variant="bodyMd" color="secondary" style={styles.doneNote}>
                Recomendamos uma avaliação médica antes de iniciar os treinos. Seu profissional foi avisado.
              </AppText>
            ) : (
              <AppText variant="bodyMd" color="secondary" style={styles.doneNote}>
                Tudo certo. Seu profissional já pode montar seus treinos.
              </AppText>
            )}
            <Button label="Concluir" onPress={() => goBackOr(HOME_ALUNO)} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <AppText variant="eyebrow" color="neon">
              {isReview ? 'PAR-Q · REVISÃO' : 'PAR-Q · PRONTIDÃO'}
            </AppText>
            <AppText variant="h2" style={styles.title}>
              {isReview ? 'Suas respostas' : 'Antes de começar'}
            </AppText>
            <AppText variant="bodyMd" color="secondary" style={styles.intro}>
              {isReview
                ? 'Estas são as respostas do seu último Par-Q. Atualize o que mudou e reenvie.'
                : 'Sete perguntas rápidas sobre sua saúde. Leva cerca de dois minutos e ajuda seu profissional a montar treinos seguros para você.'}
            </AppText>
            <View style={styles.list}>
              {PARQ_QUESTIONS.map((q) => (
                <ParqQuestionRow
                  key={q.id}
                  text={q.text}
                  value={values[q.id] ?? null}
                  onChange={(v) => setAnswer(q.id, v)}
                />
              ))}
            </View>
            <Button
              label={isReview ? 'Atualizar respostas' : 'Enviar respostas'}
              onPress={onSubmit}
              disabled={!allAnswered || saving}
              loading={saving}
            />
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgLowest },
  flex: { flex: 1 },
  topbar: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  scroll: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl },
  title: { marginTop: theme.spacing.xs },
  intro: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.md },
  list: { marginBottom: theme.spacing.lg },
  doneWrap: { flex: 1, padding: theme.spacing.lg, gap: theme.spacing.md, justifyContent: 'center' },
  doneTitle: {},
  doneNote: { marginBottom: theme.spacing.md },
}));
