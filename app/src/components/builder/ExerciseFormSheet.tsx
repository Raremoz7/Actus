import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MagnifyingGlass, X } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input } from '@/components/ui';
import { exerciseName, wgerCatalog } from '@/lib/wger/catalog';
import type { WgerExercise } from '@/lib/wger/types';
import { ExerciseThumb } from '@/components/workouts/ExerciseThumb';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// Dados que o sheet devolve ao confirmar. Sem position: a ordem sequencial é
// responsabilidade do builder. `wgerExerciseId` = id REAL escolhido na busca.
// `muscleGroup` mapeia para muscle_group de CreateWorkoutExercise; null quando
// não escolhido (não inventar grupo).
export type ExerciseFormValue = {
  name: string;
  wgerExerciseId: number; // id real do Wger (escolhido na busca)
  sets: number;
  reps: number;
  restSeconds: number;
  notes: string | null;
  muscleGroup: string | null;
};

// Grupos musculares oferecidos como chips. Rótulo = valor enviado (muscle_group
// é texto livre no backend; mantemos a grafia canônica em PT).
export const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombro',
  'Braço',
  'Core',
  'Glúteo',
  'Cardio',
] as const;

// Categoria do Wger (EN) → grupo muscular canônico em PT (mesma grafia dos chips).
const CATEGORY_PT: Record<string, string> = {
  Chest: 'Peito', Back: 'Costas', Legs: 'Pernas', Arms: 'Braço',
  Shoulders: 'Ombro', Abs: 'Core', Calves: 'Pernas', Cardio: 'Cardio',
};
function categoryToMuscleGroup(category: string): string | null {
  return CATEGORY_PT[category] ?? category ?? null;
}

export type ExerciseFormSheetProps = {
  visible: boolean;
  // Valor inicial para edição; ausente = adicionar (campos vazios/defaults).
  initialValue?: ExerciseFormValue | null;
  onClose: () => void;
  onConfirm: (value: ExerciseFormValue) => void;
};

// Defaults do backend (sets=3, reps=10, rest_seconds=60) replicados na UI.
const DEFAULT_SETS = '3';
const DEFAULT_REPS = '10';
const DEFAULT_REST = '60';

// Limites do schema (CreateWorkoutExerciseSchema) — validação discreta no cliente.
const LIMITS = {
  sets: { min: 1, max: 50 },
  reps: { min: 1, max: 500 },
  rest: { min: 0, max: 3600 },
} as const;

// Aceita só dígitos; devolve int ou null se vazio/inválido.
function toInt(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits === '') return null;
  return Number.parseInt(digits, 10);
}

function inRange(n: number | null, min: number, max: number): n is number {
  return n !== null && n >= min && n <= max;
}

// Campo numérico compacto (séries / reps / descanso) em layout de três colunas.
// `hint` mostra a faixa permitida; vira vermelho e ganha aria-invalid quando inválido.
function NumberField({
  label,
  value,
  onChangeText,
  invalid,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  invalid: boolean;
  hint: string;
}) {
  return (
    <View style={styles.numCol}>
      <AppText variant="eyebrow" color="tertiary">
        {label}
      </AppText>
      <TextInput
        style={[styles.numInput, invalid && styles.numInputError]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel={label}
        aria-invalid={invalid || undefined}
        accessibilityState={{ disabled: false }}
      />
      <AppText variant="metaSmall" color={invalid ? 'error' : 'tertiary'}>
        {hint}
      </AppText>
    </View>
  );
}

// BOTTOM SHEET de exercício em DOIS PASSOS:
//  1) `search` — busca no catálogo Wger e escolhe o exercício (id real + nome).
//  2) `prescribe` — séries / reps / descanso / nota sobre o exercício escolhido.
// O id real do Wger viaja em ExerciseFormValue.wgerExerciseId (não mais placeholder).
export function ExerciseFormSheet({
  visible,
  initialValue,
  onClose,
  onConfirm,
}: ExerciseFormSheetProps) {
  const [sets, setSets] = useState(DEFAULT_SETS);
  const [reps, setReps] = useState(DEFAULT_REPS);
  const [rest, setRest] = useState(DEFAULT_REST);
  const [notes, setNotes] = useState('');
  // Grupo muscular do exercício escolhido (derivado da categoria Wger); null = nenhum.
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  // Só mostra erros depois de uma tentativa de confirmar (validação discreta).
  const [submitted, setSubmitted] = useState(false);

  // Passo atual e estado da busca. Ao editar, começa direto em `prescribe`.
  const [mode, setMode] = useState<'search' | 'prescribe'>(
    initialValue ? 'prescribe' : 'search',
  );
  const [query, setQuery] = useState('');
  // Exercício escolhido (id real do Wger + nome + grupo). null = ainda não escolhido.
  const [picked, setPicked] = useState<
    { name: string; wgerId: number; muscleGroup: string | null } | null
  >(
    initialValue
      ? {
          name: initialValue.name,
          wgerId: initialValue.wgerExerciseId,
          muscleGroup: initialValue.muscleGroup,
        }
      : null,
  );

  // Reseta/preenche os campos sempre que o sheet abre.
  useEffect(() => {
    if (!visible) return;
    setSets(initialValue ? String(initialValue.sets) : DEFAULT_SETS);
    setReps(initialValue ? String(initialValue.reps) : DEFAULT_REPS);
    setRest(initialValue ? String(initialValue.restSeconds) : DEFAULT_REST);
    setNotes(initialValue?.notes ?? '');
    setMuscleGroup(initialValue?.muscleGroup ?? null);
    setSubmitted(false);
    setMode(initialValue ? 'prescribe' : 'search');
    setQuery('');
    setPicked(
      initialValue
        ? {
            name: initialValue.name,
            wgerId: initialValue.wgerExerciseId,
            muscleGroup: initialValue.muscleGroup,
          }
        : null,
    );
  }, [visible, initialValue]);

  // Resultados da busca (até 20). Vazio quando o termo está em branco.
  const results = useMemo(
    () => (query.trim() ? wgerCatalog().search(query, 20) : []),
    [query],
  );

  // Escolhe um exercício do catálogo → preenche nome/grupo e vai pro passo prescrever.
  function choose(ex: WgerExercise) {
    const mg = categoryToMuscleGroup(ex.category);
    setPicked({ name: exerciseName(ex), wgerId: ex.id, muscleGroup: mg });
    setMuscleGroup(mg);
    setMode('prescribe');
  }

  // ÚNICA animação do sheet: slide/fade de entrada (300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(visible ? 1 : 0, { duration: motion.screenMs });
  }, [visible, reveal]);
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 24 }],
  }));

  const parsed = useMemo(
    () => ({
      sets: toInt(sets),
      reps: toInt(reps),
      rest: toInt(rest),
    }),
    [sets, reps, rest],
  );

  const errors = {
    sets: !inRange(parsed.sets, LIMITS.sets.min, LIMITS.sets.max),
    reps: !inRange(parsed.reps, LIMITS.reps.min, LIMITS.reps.max),
    rest: !inRange(parsed.rest, LIMITS.rest.min, LIMITS.rest.max),
  };
  const hasError = errors.sets || errors.reps || errors.rest;

  function handleConfirm() {
    setSubmitted(true);
    if (!picked || hasError) return;
    onConfirm({
      name: picked.name,
      wgerExerciseId: picked.wgerId,
      sets: parsed.sets as number,
      reps: parsed.reps as number,
      restSeconds: parsed.rest as number,
      notes: notes.trim() === '' ? null : notes.trim(),
      muscleGroup,
    });
  }

  const isEditing = Boolean(initialValue);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropPress}
          accessibilityRole="button"
          accessibilityLabel="Fechar formulário"
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <AppText variant="h3">
                {mode === 'search'
                  ? 'Buscar exercício'
                  : isEditing
                    ? 'Editar exercício'
                    : 'Adicionar exercício'}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                hitSlop={12}
                onPress={onClose}
              >
                <X size={20} weight="bold" color={colors.textSecondary} />
              </Pressable>
            </View>

            {mode === 'search' ? (
              // --- Passo 1: busca no catálogo Wger ---
              <>
                <View style={styles.search}>
                  <MagnifyingGlass
                    size={18}
                    weight="duotone"
                    color={colors.textTertiary}
                  />
                  <TextInput
                    style={styles.searchInput}
                    accessibilityLabel="Buscar exercício"
                    placeholder="Buscar no Wger (ex.: supino)"
                    placeholderTextColor={colors.textTertiary}
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    returnKeyType="search"
                  />
                </View>

                <ScrollView
                  style={styles.resultsList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {results.length === 0 ? (
                    <AppText variant="bodySm" color="tertiary">
                      {query.trim()
                        ? 'Nenhum exercício encontrado.'
                        : 'Digite para buscar no catálogo.'}
                    </AppText>
                  ) : (
                    results.map((ex) => (
                      <Pressable
                        key={ex.id}
                        accessibilityRole="button"
                        accessibilityLabel={exerciseName(ex)}
                        onPress={() => choose(ex)}
                        style={styles.resultRow}
                      >
                        <ExerciseThumb size={40} wgerExerciseId={ex.id} muscleGroup={ex.muscles[0] ?? null} />
                        <View style={styles.resultText}>
                          <AppText variant="bodyMd" numberOfLines={1}>
                            {exerciseName(ex)}
                          </AppText>
                          <AppText variant="metaSmall" color="tertiary">
                            {`${ex.category}${
                              ex.equipment[0] ? ' · ' + ex.equipment[0] : ''
                            }`}
                          </AppText>
                        </View>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </>
            ) : (
              // --- Passo 2: prescrever sobre o exercício escolhido ---
              <>
                <View style={styles.pickedRow}>
                  <View style={styles.pickedText}>
                    <AppText variant="eyebrow" color="tertiary">
                      Exercício
                    </AppText>
                    <AppText variant="h3" numberOfLines={2}>
                      {picked?.name ?? ''}
                    </AppText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Trocar exercício"
                    hitSlop={8}
                    onPress={() => setMode('search')}
                  >
                    <AppText variant="metaSmall" color="neon">
                      trocar
                    </AppText>
                  </Pressable>
                </View>

                <View style={styles.numRow}>
                  <NumberField
                    label="Séries"
                    value={sets}
                    onChangeText={setSets}
                    invalid={submitted && errors.sets}
                    hint={`${LIMITS.sets.min}–${LIMITS.sets.max}`}
                  />
                  <NumberField
                    label="Reps"
                    value={reps}
                    onChangeText={setReps}
                    invalid={submitted && errors.reps}
                    hint={`${LIMITS.reps.min}–${LIMITS.reps.max}`}
                  />
                  <NumberField
                    label="Descanso (s)"
                    value={rest}
                    onChangeText={setRest}
                    invalid={submitted && errors.rest}
                    hint={`${LIMITS.rest.min}–${LIMITS.rest.max}`}
                  />
                </View>

                <Input
                  label="Observação · opcional"
                  accessibilityLabel="Observação"
                  placeholder="Cadência, dica de execução…"
                  value={notes}
                  onChangeText={setNotes}
                  autoCapitalize="sentences"
                />

                <View style={styles.cta}>
                  <Button
                    variant="primary"
                    label={isEditing ? 'Salvar exercício' : 'Adicionar'}
                    onPress={handleConfirm}
                  />
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: theme.colors.bgBase,
    borderTopLeftRadius: theme.radius.modal,
    borderTopRightRadius: theme.radius.modal,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
    // Sombra: permitida em sheet (exceção do design para modal/sheet/dropdown).
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: theme.radius.tag,
    backgroundColor: theme.colors.surface3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontFamily: theme.fontFamily.body,
    fontSize: theme.typeScale.bodyMd,
    color: theme.colors.textPrimary,
  },
  resultsList: {
    maxHeight: 320,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  resultText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  pickedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  pickedText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  numRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  numCol: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  numInput: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.input,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.typeScale.dataMed,
    color: theme.colors.textPrimary,
  },
  numInputError: {
    borderColor: theme.colors.error,
  },
  cta: {
    marginTop: theme.spacing.xs,
  },
}));
