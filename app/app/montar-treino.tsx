// Builder de treino (rota '/montar-treino'). Cria um novo template; se receber
// `?id=<workoutId>`, EDITA (carrega o detalhe e pré-preenche).
//
// Wizard de 3 passos ao criar (1 nome/foco · 2 exercícios · 3 revisar). Ao editar,
// pula direto para o passo 2 (lista editável), de onde se chega ao 3 (revisar).
//
// NOTA WGER: a API exige `wger_exercise_id` (int>=1) e NÃO há busca de catálogo
// Wger na v1. Cada exercício é um FORMULÁRIO manual (nome digitado em name_snapshot)
// com wger_exercise_id=1 como placeholder.
// [MOCK — sem busca Wger na API v1: id placeholder; nome digitado manualmente]

import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeft, Plus } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input } from '@/components/ui';
import { WizardProgress } from '@/components/molecules';
import {
  ExerciseEditRow,
  ExerciseFormSheet,
  type ExerciseFormValue,
} from '@/components/builder';
import { useProWorkoutDetail } from '@/hooks/useProWorkoutDetail';
import { useWorkoutMutations } from '@/hooks/useWorkoutMutations';
import type { CreateWorkoutExercise } from '@/types/workouts';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// [MOCK — sem busca Wger na API v1: id placeholder; nome digitado manualmente]
const WGER_PLACEHOLDER_ID = 1;

// Exercício no estado local do builder (sem position — derivada da ordem do array).
type DraftExercise = ExerciseFormValue;

type Step = 1 | 2 | 3;

// Converte o estado local em exercises[] do corpo da API (position 1-based
// sequencial + placeholder Wger). Mesma forma para create e PATCH (full replace).
function toApiExercises(drafts: DraftExercise[]): CreateWorkoutExercise[] {
  return drafts.map((d, i) => ({
    position: i + 1,
    wger_exercise_id: WGER_PLACEHOLDER_ID,
    name_snapshot: d.name,
    sets: d.sets,
    reps: d.reps,
    rest_seconds: d.restSeconds,
    notes: d.notes ?? undefined,
  }));
}

export default function MontarTreinoScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = typeof params.id === 'string' ? params.id : undefined;
  const isEditing = Boolean(editingId);

  const detail = useProWorkoutDetail(editingId);
  const { create, update } = useWorkoutMutations();

  // Estado local do formulário.
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  // Ao editar, abre direto no passo 2 (lista editável).
  const [step, setStep] = useState<Step>(isEditing ? 2 : 1);
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  // Sheet de adicionar/editar exercício. editIndex=null → adicionar.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  // Evita pré-preencher o formulário duas vezes quando o detalhe recarrega.
  const [hydrated, setHydrated] = useState(false);

  // Pré-preenche a partir do detalhe carregado (modo edição).
  useEffect(() => {
    if (!isEditing || hydrated || !detail.data) return;
    setName(detail.data.name);
    setNotes(detail.data.notes ?? '');
    setExercises(
      [...detail.data.exercises]
        .sort((a, b) => a.position - b.position)
        .map((e) => ({
          name: e.name_snapshot,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.rest_seconds,
          notes: e.notes,
        })),
    );
    setHydrated(true);
  }, [isEditing, hydrated, detail.data]);

  // ÚNICA animação da tela: reveal de entrada (opacity + translateY, 300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  const saving = create.isPending || update.isPending;

  const eyebrow = useMemo(() => {
    if (isEditing) return 'Editar treino';
    return `Passo ${step} de 3`;
  }, [isEditing, step]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(personal)/(tabs)/treinos');
    }
  }

  // Passo 1 → 2: nome obrigatório.
  function handleStep1Continue() {
    if (name.trim().length === 0) {
      setNameError('Dê um nome ao treino');
      return;
    }
    setNameError(undefined);
    setStep(2);
  }

  function openAddSheet() {
    setEditIndex(null);
    setSheetOpen(true);
  }

  function openEditSheet(index: number) {
    setEditIndex(index);
    setSheetOpen(true);
  }

  function handleSheetConfirm(value: ExerciseFormValue) {
    setExercises((prev) => {
      if (editIndex === null) return [...prev, value];
      const next = [...prev];
      next[editIndex] = value;
      return next;
    });
    setSheetOpen(false);
    setEditIndex(null);
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  // Reordena trocando com o vizinho (↑↓ simples).
  function moveExercise(index: number, dir: -1 | 1) {
    setExercises((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const a = prev[index];
      const b = prev[target];
      if (a === undefined || b === undefined) return prev;
      const next = [...prev];
      next[index] = b;
      next[target] = a;
      return next;
    });
  }

  function handleSave() {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setNameError('Dê um nome ao treino');
      setStep(1);
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Treino sem exercícios', 'Adicione ao menos um exercício antes de salvar.');
      setStep(2);
      return;
    }

    const apiExercises = toApiExercises(exercises);
    const trimmedNotes = notes.trim();

    if (isEditing && editingId) {
      update.mutate(
        {
          id: editingId,
          body: {
            name: trimmedName,
            notes: trimmedNotes === '' ? null : trimmedNotes,
            exercises: apiExercises,
          },
        },
        {
          onSuccess: () => handleBack(),
          onError: () =>
            Alert.alert('Não foi possível salvar', 'Tente novamente em instantes.'),
        },
      );
      return;
    }

    create.mutate(
      {
        name: trimmedName,
        notes: trimmedNotes === '' ? undefined : trimmedNotes,
        exercises: apiExercises,
      },
      {
        onSuccess: () => handleBack(),
        onError: () =>
          Alert.alert('Não foi possível salvar', 'Tente novamente em instantes.'),
      },
    );
  }

  // Estado de carregamento do detalhe (só no modo edição, antes de hidratar).
  const loadingDetail = isEditing && detail.isLoading && !hydrated;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={handleBack}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerText}>
          <AppText variant="eyebrow" color="tertiary">
            {eyebrow}
          </AppText>
          <AppText variant="h2">{isEditing ? 'Editar' : 'Montar treino'}</AppText>
        </View>
      </View>

      {!isEditing ? (
        <View style={styles.progress}>
          <WizardProgress total={3} current={step} />
        </View>
      ) : null}

      <Animated.View style={[styles.flex, revealStyle]}>
        {loadingDetail ? (
          <View style={styles.center}>
            <AppText variant="bodyMd" color="tertiary">
              Carregando treino…
            </AppText>
          </View>
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 ? (
              // --- Passo 1: nome + foco/notas ---
              <View style={styles.form}>
                <Input
                  label="Nome do treino"
                  accessibilityLabel="Nome do treino"
                  placeholder="Ex.: Treino A · Peito e tríceps"
                  value={name}
                  onChangeText={(t) => {
                    if (nameError) setNameError(undefined);
                    setName(t);
                  }}
                  autoCapitalize="sentences"
                  error={nameError}
                />
                <Input
                  label="Foco · opcional"
                  accessibilityLabel="Foco do treino"
                  placeholder="Objetivo, observações gerais…"
                  value={notes}
                  onChangeText={setNotes}
                  autoCapitalize="sentences"
                  multiline
                />
              </View>
            ) : null}

            {step === 2 ? (
              // --- Passo 2: lista editável de exercícios ---
              <View style={styles.form}>
                <AppText variant="eyebrow" color="tertiary">
                  Exercícios
                </AppText>

                {exercises.length === 0 ? (
                  <View style={styles.empty}>
                    <AppText variant="bodyMd" color="tertiary">
                      Nenhum exercício ainda. Adicione o primeiro abaixo.
                    </AppText>
                  </View>
                ) : (
                  exercises.map((ex, i) => (
                    <ExerciseEditRow
                      key={`${ex.name}-${i}`}
                      name={ex.name}
                      sets={ex.sets}
                      reps={ex.reps}
                      restSeconds={ex.restSeconds}
                      position={i + 1}
                      canMoveUp={i > 0}
                      canMoveDown={i < exercises.length - 1}
                      onEdit={() => openEditSheet(i)}
                      onRemove={() => removeExercise(i)}
                      onMoveUp={() => moveExercise(i, -1)}
                      onMoveDown={() => moveExercise(i, 1)}
                    />
                  ))
                )}

                <View style={styles.addBtn}>
                  <Button
                    variant="secondary"
                    label="Adicionar exercício"
                    icon={<Plus size={18} weight="bold" color={colors.textPrimary} />}
                    onPress={openAddSheet}
                  />
                </View>
              </View>
            ) : null}

            {step === 3 ? (
              // --- Passo 3: revisar ---
              <View style={styles.form}>
                <View style={styles.reviewHead}>
                  <AppText variant="eyebrow" color="tertiary">
                    Treino
                  </AppText>
                  <AppText variant="h3">{name.trim()}</AppText>
                  {notes.trim() !== '' ? (
                    <AppText variant="bodySm" color="secondary">
                      {notes.trim()}
                    </AppText>
                  ) : null}
                </View>

                <AppText variant="eyebrow" color="tertiary">
                  {`${exercises.length} ${exercises.length === 1 ? 'exercício' : 'exercícios'}`}
                </AppText>

                {exercises.map((ex, i) => (
                  <View key={`${ex.name}-${i}`} style={styles.reviewRow}>
                    <AppText variant="metaSmall" color="tertiary">
                      {String(i + 1).padStart(2, '0')}
                    </AppText>
                    <AppText variant="bodyMd" style={styles.reviewName} numberOfLines={1}>
                      {ex.name}
                    </AppText>
                    <AppText variant="dataMed" color="neon">
                      {`${ex.sets}×${ex.reps}`}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        )}
      </Animated.View>

      {!loadingDetail ? (
        <View style={styles.footer}>
          {step === 1 ? (
            <Button variant="primary" label="Continuar" onPress={handleStep1Continue} />
          ) : null}

          {step === 2 ? (
            <View style={styles.footerRow}>
              {!isEditing ? (
                <View style={styles.footerCol}>
                  <Button variant="ghost" label="Voltar" onPress={() => setStep(1)} />
                </View>
              ) : null}
              <View style={styles.footerCol}>
                <Button
                  variant="primary"
                  label="Revisar"
                  onPress={() => {
                    if (exercises.length === 0) {
                      Alert.alert(
                        'Treino sem exercícios',
                        'Adicione ao menos um exercício antes de continuar.',
                      );
                      return;
                    }
                    setStep(3);
                  }}
                />
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.footerRow}>
              <View style={styles.footerCol}>
                <Button variant="ghost" label="Voltar" onPress={() => setStep(2)} />
              </View>
              <View style={styles.footerCol}>
                <Button
                  variant="primary"
                  label="Salvar treino"
                  loading={saving}
                  onPress={handleSave}
                />
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      <ExerciseFormSheet
        visible={sheetOpen}
        initialValue={editIndex !== null ? exercises[editIndex] : null}
        onClose={() => {
          setSheetOpen(false);
          setEditIndex(null);
        }}
        onConfirm={handleSheetConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  progress: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.lg,
  },
  empty: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  addBtn: {
    marginTop: theme.spacing.xs,
  },
  reviewHead: {
    gap: theme.spacing.xs,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  reviewName: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  footerCol: {
    flex: 1,
  },
}));
