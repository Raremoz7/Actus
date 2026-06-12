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
import { Funnel, MagnifyingGlass, X } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input } from '@/components/ui';
import {
  exerciseCatalog,
  CATEGORY_PT,
  MUSCLE_PT,
  EQUIPMENT_PT,
  LEVEL_PT,
} from '@/lib/exercises/catalog';
import type { Exercise } from '@/lib/exercises/types';
import { ExerciseThumb } from '@/components/workouts/ExerciseThumb';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// Dados que o sheet devolve ao confirmar. Sem position: a ordem sequencial é
// responsabilidade do builder. Um dos dois ids de exercício deve ser não-nulo.
export type ExerciseFormValue = {
  name: string;
  exerciseId: string | null;     // slug do catálogo PT-BR (novo)
  wgerExerciseId: number | null; // id legado do Wger (exercícios antigos)
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

// Músculo primário do catálogo (EN) → grupo canônico em PT (grafia dos chips).
const MUSCLE_TO_GROUP: Record<string, string> = {
  chest: 'Peito',
  lats: 'Costas', 'middle back': 'Costas', 'upper back': 'Costas',
  'lower back': 'Costas', traps: 'Costas',
  quadriceps: 'Pernas', hamstrings: 'Pernas', calves: 'Pernas',
  adductors: 'Pernas', abductors: 'Pernas',
  shoulders: 'Ombro', neck: 'Ombro',
  biceps: 'Braço', triceps: 'Braço', forearms: 'Braço',
  abdominals: 'Core',
  glutes: 'Glúteo',
};
function catalogMuscleGroup(ex: Exercise): string | null {
  return MUSCLE_TO_GROUP[ex.primary_muscles[0] ?? ''] ?? null;
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  // Exercício escolhido (id do catálogo + nome + grupo). null = ainda não escolhido.
  const [picked, setPicked] = useState<
    { name: string; exerciseId: string | null; muscleGroup: string | null } | null
  >(
    initialValue
      ? {
          name: initialValue.name,
          exerciseId: initialValue.exerciseId,
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
    setFiltersOpen(false);
    setFilterCategory('');
    setFilterMuscle('');
    setFilterEquipment('');
    setFilterLevel('');
    setPicked(
      initialValue
        ? {
            name: initialValue.name,
            exerciseId: initialValue.exerciseId,
            muscleGroup: initialValue.muscleGroup,
          }
        : null,
    );
  }, [visible, initialValue]);

  const activeFilterCount = [filterCategory, filterMuscle, filterEquipment, filterLevel].filter(Boolean).length;

  function clearFilters() {
    setFilterCategory('');
    setFilterMuscle('');
    setFilterEquipment('');
    setFilterLevel('');
  }

  // Busca no catálogo + filtros client-side.
  // Sem texto e sem filtros: retorna os primeiros 20 (catálogo padrão).
  // Com filtros e sem texto: percorre tudo antes de filtrar.
  const results = useMemo(() => {
    const hasQuery = query.trim().length > 0;
    const hasFilters = !!(filterCategory || filterMuscle || filterEquipment || filterLevel);
    const limit = hasQuery ? 200 : hasFilters ? 1000 : 20;

    let pool = exerciseCatalog().search(query.trim(), limit);
    if (filterCategory)  pool = pool.filter((e) => e.category === filterCategory);
    if (filterMuscle)    pool = pool.filter((e) => e.primary_muscles.includes(filterMuscle) || e.secondary_muscles.includes(filterMuscle));
    if (filterEquipment) pool = pool.filter((e) => e.equipment === filterEquipment);
    if (filterLevel)     pool = pool.filter((e) => e.level === filterLevel);
    return pool.slice(0, 20);
  }, [query, filterCategory, filterMuscle, filterEquipment, filterLevel]);

  // Escolhe um exercício do catálogo → preenche nome/grupo e vai pro passo prescrever.
  function choose(ex: Exercise) {
    const mg = catalogMuscleGroup(ex);
    setPicked({ name: ex.name_pt, exerciseId: ex.id, muscleGroup: mg });
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
      exerciseId: picked.exerciseId,
      wgerExerciseId: null,
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
              // --- Passo 1: busca no catálogo PT-BR ---
              <>
                {/* Barra de busca + botão de filtros */}
                <View style={styles.searchRow}>
                  <View style={styles.search}>
                    <MagnifyingGlass
                      size={18}
                      weight="duotone"
                      color={colors.textTertiary}
                    />
                    <TextInput
                      style={styles.searchInput}
                      accessibilityLabel="Buscar exercício"
                      placeholder="supino, agachamento…"
                      placeholderTextColor={colors.textTertiary}
                      value={query}
                      onChangeText={setQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                      returnKeyType="search"
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Filtros"
                    onPress={() => setFiltersOpen((o) => !o)}
                    style={[styles.filterBtn, (filtersOpen || activeFilterCount > 0) && styles.filterBtnOpen]}
                  >
                    <Funnel
                      size={15}
                      weight="duotone"
                      color={filtersOpen || activeFilterCount > 0 ? colors.neon : colors.textSecondary}
                    />
                    <AppText variant="metaSmall" color={filtersOpen || activeFilterCount > 0 ? 'neon' : 'secondary'}>
                      Filtros
                    </AppText>
                    {activeFilterCount > 0 && (
                      <View style={styles.filterBadge}>
                        <AppText variant="metaSmall" color="inverse">
                          {activeFilterCount}
                        </AppText>
                      </View>
                    )}
                  </Pressable>
                </View>

                {/* Painel de filtros — aparece ao tocar no botão */}
                {filtersOpen && (
                  <View style={styles.filterPanel}>
                    {/* Categoria */}
                    <View>
                      <AppText variant="metaSmall" color="tertiary" style={styles.filterRowLabel}>
                        Categoria
                      </AppText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filterChips}>
                          {Object.entries(CATEGORY_PT).map(([key, label]) => (
                            <Pressable
                              key={key}
                              onPress={() => setFilterCategory(filterCategory === key ? '' : key)}
                              style={[styles.filterChip, filterCategory === key && styles.filterChipActive]}
                            >
                              <AppText variant="metaSmall" color={filterCategory === key ? 'inverse' : 'secondary'}>
                                {label}
                              </AppText>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Músculo */}
                    <View>
                      <AppText variant="metaSmall" color="tertiary" style={styles.filterRowLabel}>
                        Músculo
                      </AppText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filterChips}>
                          {Object.entries(MUSCLE_PT).map(([key, label]) => (
                            <Pressable
                              key={key}
                              onPress={() => setFilterMuscle(filterMuscle === key ? '' : key)}
                              style={[styles.filterChip, filterMuscle === key && styles.filterChipActive]}
                            >
                              <AppText variant="metaSmall" color={filterMuscle === key ? 'inverse' : 'secondary'}>
                                {label}
                              </AppText>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Equipamento */}
                    <View>
                      <AppText variant="metaSmall" color="tertiary" style={styles.filterRowLabel}>
                        Equipamento
                      </AppText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filterChips}>
                          {Object.entries(EQUIPMENT_PT).map(([key, label]) => (
                            <Pressable
                              key={key}
                              onPress={() => setFilterEquipment(filterEquipment === key ? '' : key)}
                              style={[styles.filterChip, filterEquipment === key && styles.filterChipActive]}
                            >
                              <AppText variant="metaSmall" color={filterEquipment === key ? 'inverse' : 'secondary'}>
                                {label}
                              </AppText>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Nível */}
                    <View>
                      <AppText variant="metaSmall" color="tertiary" style={styles.filterRowLabel}>
                        Nível
                      </AppText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filterChips}>
                          {Object.entries(LEVEL_PT).map(([key, label]) => (
                            <Pressable
                              key={key}
                              onPress={() => setFilterLevel(filterLevel === key ? '' : key)}
                              style={[styles.filterChip, filterLevel === key && styles.filterChipActive]}
                            >
                              <AppText variant="metaSmall" color={filterLevel === key ? 'inverse' : 'secondary'}>
                                {label}
                              </AppText>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {activeFilterCount > 0 && (
                      <Pressable onPress={clearFilters} style={styles.filterClear}>
                        <AppText variant="metaSmall" color="tertiary">Limpar filtros</AppText>
                      </Pressable>
                    )}
                  </View>
                )}

                <ScrollView
                  style={[styles.resultsList, filtersOpen && styles.resultsListCompact]}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {results.length === 0 ? (
                    <AppText variant="bodySm" color="tertiary">
                      Nenhum exercício encontrado.
                    </AppText>
                  ) : (
                    results.map((ex) => (
                      <Pressable
                        key={ex.id}
                        accessibilityRole="button"
                        accessibilityLabel={ex.name_pt}
                        onPress={() => choose(ex)}
                        style={styles.resultRow}
                      >
                        <ExerciseThumb size={40} exerciseId={ex.id} muscleGroup={ex.primary_muscles[0] ?? null} />
                        <View style={styles.resultText}>
                          <AppText variant="bodyMd" numberOfLines={1}>
                            {ex.name_pt}
                          </AppText>
                          <AppText variant="metaSmall" color="tertiary">
                            {[ex.category, ex.equipment].filter(Boolean).join(' · ')}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  search: {
    flex: 1,
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
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surface1,
  },
  filterBtnOpen: {
    borderColor: theme.colors.neon,
  },
  filterBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterPanel: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  filterRowLabel: {
    marginBottom: theme.spacing.xs,
  },
  filterChips: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  filterChip: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surface2,
  },
  filterChipActive: {
    backgroundColor: theme.colors.neon,
    borderColor: theme.colors.neon,
  },
  filterClear: {
    alignSelf: 'flex-end',
  },
  resultsList: {
    maxHeight: 320,
  },
  resultsListCompact: {
    maxHeight: 160,
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
