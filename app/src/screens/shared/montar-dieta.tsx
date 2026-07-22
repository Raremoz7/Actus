// Builder de dieta (rota '/montar-dieta'). Cria um novo template; se receber
// `?id=<dietTemplateId>`, EDITA (carrega o detalhe e pré-preenche).
//
// Wizard de 3 passos ao criar (1 nome · 2 refeições · 3 revisar). Ao editar,
// pula direto para o passo 2 (lista editável), de onde se chega ao 3 (revisar).
//
// O `body` da dieta é jsonb LIVRE no backend — a forma é definida/validada PELO
// APP (DietBodySchema): { meals: [{ name, foods?, kcal?, protein?, carbs?, fat? }], notes? }.
// Ler o detalhe usa parseDietBody (fallback tolerante p/ templates antigos).

import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from '@/navigation';
import { CaretLeft, Plus } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Card, Input, ListState, Tag } from '@/components/ui';
import { WizardProgress } from '@/components/molecules';
import { MealEditRow, MealFormSheet, type MealFormValue } from '@/components/diet';
import { useDietTemplateDetail } from '@/hooks/useDietTemplateDetail';
import { useDietMutations } from '@/hooks/useDietMutations';
import { parseDietBody, type Meal } from '@/types/diets';
import { darkTheme } from '@/theme';
import { apiErrorMessage } from '@/lib/apiErrorMessage';

const { colors, motion } = darkTheme;

// Refeição no estado local do builder — mesma forma do MealFormValue/Meal.
type DraftMeal = MealFormValue;

type Step = 1 | 2 | 3;

// Converte o estado local em meals[] do corpo da API (DietBodySchema). Macros
// opcionais já vêm ausentes do sheet; aqui só repassamos.
function toMeals(drafts: DraftMeal[]): Meal[] {
  return drafts.map((d) => ({
    name: d.name,
    ...(d.time === undefined ? {} : { time: d.time }),
    ...(d.foods === undefined ? {} : { foods: d.foods }),
    ...(d.kcal === undefined ? {} : { kcal: d.kcal }),
    ...(d.protein === undefined ? {} : { protein: d.protein }),
    ...(d.carbs === undefined ? {} : { carbs: d.carbs }),
    ...(d.fat === undefined ? {} : { fat: d.fat }),
  }));
}

// Metas diárias do dia (texto livre numérico). Estado local em string; viram
// number no body só quando preenchidas (>=0). Espelha DietBody.target_*/water.
type DayTargets = {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  water: string;
};

const EMPTY_TARGETS: DayTargets = {
  kcal: '',
  protein: '',
  carbs: '',
  fat: '',
  water: '',
};

// Aceita só dígitos; devolve int ou undefined se vazio.
function targetToNumber(raw: string): number | undefined {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits === '') return undefined;
  return Number.parseInt(digits, 10);
}

// Converte número opcional do body em string de campo (vazio quando ausente).
function numToTargetField(n: number | undefined): string {
  return n === undefined ? '' : String(n);
}

// Campo numérico compacto para as metas do dia (grid de dois). Mono, placeholder
// discreto. Sem validação dura: vazio = meta ausente.
function TargetField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.targetCol}>
      <AppText variant="eyebrow" color="tertiary">
        {label}
      </AppText>
      <TextInput
        style={styles.targetInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel={label}
      />
    </View>
  );
}

export default function MontarDietaScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = typeof params.id === 'string' ? params.id : undefined;
  const isEditing = Boolean(editingId);

  const detail = useDietTemplateDetail(editingId);
  const { create, update } = useDietMutations();

  // Estado local do formulário.
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [meals, setMeals] = useState<DraftMeal[]>([]);
  // Metas do dia (opcionais): kcal/proteína/carbo/gordura + água (mL).
  const [targets, setTargets] = useState<DayTargets>(EMPTY_TARGETS);
  // Ao editar, abre direto no passo 2 (lista editável).
  const [step, setStep] = useState<Step>(isEditing ? 2 : 1);
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  // Sheet de adicionar/editar refeição. editIndex=null → adicionar.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  // Evita pré-preencher o formulário duas vezes quando o detalhe recarrega.
  const [hydrated, setHydrated] = useState(false);

  // Pré-preenche a partir do detalhe carregado (modo edição). O body é jsonb
  // livre → parseDietBody devolve sempre { meals, notes? } válido.
  useEffect(() => {
    if (!isEditing || hydrated || !detail.data) return;
    const parsed = parseDietBody(detail.data.body);
    setName(detail.data.name);
    setNotes(parsed.notes ?? '');
    setMeals(
      parsed.meals.map((m) => ({
        name: m.name,
        time: m.time,
        foods: m.foods,
        kcal: m.kcal,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
      })),
    );
    setTargets({
      kcal: numToTargetField(parsed.target_kcal),
      protein: numToTargetField(parsed.target_protein),
      carbs: numToTargetField(parsed.target_carbs),
      fat: numToTargetField(parsed.target_fat),
      water: numToTargetField(parsed.water),
    });
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
    if (isEditing) return 'Editar dieta';
    return `Passo ${step} de 3`;
  }, [isEditing, step]);

  // Chips de metas para o sumário (passo 3) — só as preenchidas.
  const targetChips = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    const kcal = targetToNumber(targets.kcal);
    const protein = targetToNumber(targets.protein);
    const carbs = targetToNumber(targets.carbs);
    const fat = targetToNumber(targets.fat);
    const water = targetToNumber(targets.water);
    if (kcal !== undefined) out.push({ key: 'kcal', label: `${kcal} kcal` });
    if (protein !== undefined) out.push({ key: 'protein', label: `P ${protein}g` });
    if (carbs !== undefined) out.push({ key: 'carbs', label: `C ${carbs}g` });
    if (fat !== undefined) out.push({ key: 'fat', label: `G ${fat}g` });
    if (water !== undefined) out.push({ key: 'water', label: `${water} mL água` });
    return out;
  }, [targets]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(nutri)/(tabs)/dietas');
    }
  }

  // Passo 1 → 2: nome obrigatório.
  function handleStep1Continue() {
    if (name.trim().length === 0) {
      setNameError('Dê um nome à dieta');
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

  function handleSheetConfirm(value: MealFormValue) {
    setMeals((prev) => {
      if (editIndex === null) return [...prev, value];
      const next = [...prev];
      next[editIndex] = value;
      return next;
    });
    setSheetOpen(false);
    setEditIndex(null);
  }

  function removeMeal(index: number) {
    setMeals((prev) => prev.filter((_, i) => i !== index));
  }

  // Reordena trocando com o vizinho (↑↓ simples).
  function moveMeal(index: number, dir: -1 | 1) {
    setMeals((prev) => {
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
      setNameError('Dê um nome à dieta');
      setStep(1);
      return;
    }
    if (meals.length === 0) {
      Alert.alert('Dieta sem refeições', 'Adicione ao menos uma refeição antes de salvar.');
      setStep(2);
      return;
    }

    const trimmedNotes = notes.trim();
    const targetKcal = targetToNumber(targets.kcal);
    const targetProtein = targetToNumber(targets.protein);
    const targetCarbs = targetToNumber(targets.carbs);
    const targetFat = targetToNumber(targets.fat);
    const water = targetToNumber(targets.water);
    const body = {
      meals: toMeals(meals),
      ...(targetKcal === undefined ? {} : { target_kcal: targetKcal }),
      ...(targetProtein === undefined ? {} : { target_protein: targetProtein }),
      ...(targetCarbs === undefined ? {} : { target_carbs: targetCarbs }),
      ...(targetFat === undefined ? {} : { target_fat: targetFat }),
      ...(water === undefined ? {} : { water }),
      ...(trimmedNotes === '' ? {} : { notes: trimmedNotes }),
    };

    if (isEditing && editingId) {
      update.mutate(
        { id: editingId, body: { name: trimmedName, body } },
        {
          onSuccess: () => handleBack(),
          onError: (err) =>
            Alert.alert('Não foi possível salvar', apiErrorMessage(err)),
        },
      );
      return;
    }

    create.mutate(
      { name: trimmedName, body },
      {
        onSuccess: () => handleBack(),
        onError: (err) =>
          Alert.alert('Não foi possível salvar', apiErrorMessage(err)),
      },
    );
  }

  // Estado de carregamento do detalhe (só no modo edição, antes de hidratar).
  const loadingDetail = isEditing && detail.isLoading && !hydrated;
  // Falha ao carregar o detalhe em edição (antes de hidratar) → não mostrar form vazio.
  const detailError = isEditing && detail.isError && !hydrated;

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
          <AppText variant="h2">{isEditing ? 'Editar' : 'Montar dieta'}</AppText>
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
              Carregando dieta…
            </AppText>
          </View>
        ) : detailError ? (
          <ListState
            kind="error"
            title="Não foi possível abrir a dieta"
            message="Verifique sua conexão e tente novamente."
            actionLabel="Tentar de novo"
            onAction={() => void detail.refetch()}
          />
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 ? (
              // --- Passo 1: nome + observações ---
              <View style={styles.form}>
                <Input
                  label="Nome da dieta"
                  accessibilityLabel="Nome da dieta"
                  placeholder="Ex.: Cutting · 1800 kcal"
                  value={name}
                  onChangeText={(t) => {
                    if (nameError) setNameError(undefined);
                    setName(t);
                  }}
                  autoCapitalize="sentences"
                  error={nameError}
                />
                <Input
                  label="Observações · opcional"
                  accessibilityLabel="Observações da dieta"
                  placeholder="Objetivo, hidratação, suplementos…"
                  value={notes}
                  onChangeText={setNotes}
                  autoCapitalize="sentences"
                  multiline
                />

                {/* Metas do dia (opcionais) — gravadas no body da dieta. */}
                <View style={styles.targets}>
                  <AppText variant="eyebrow" color="tertiary">
                    Metas do dia · opcional
                  </AppText>
                  <View style={styles.targetRow}>
                    <TargetField
                      label="Kcal"
                      value={targets.kcal}
                      onChangeText={(t) => setTargets((p) => ({ ...p, kcal: t }))}
                    />
                    <TargetField
                      label="Proteína (g)"
                      value={targets.protein}
                      onChangeText={(t) => setTargets((p) => ({ ...p, protein: t }))}
                    />
                  </View>
                  <View style={styles.targetRow}>
                    <TargetField
                      label="Carbo (g)"
                      value={targets.carbs}
                      onChangeText={(t) => setTargets((p) => ({ ...p, carbs: t }))}
                    />
                    <TargetField
                      label="Gordura (g)"
                      value={targets.fat}
                      onChangeText={(t) => setTargets((p) => ({ ...p, fat: t }))}
                    />
                  </View>
                  <View style={styles.targetRow}>
                    <TargetField
                      label="Água (mL)"
                      value={targets.water}
                      onChangeText={(t) => setTargets((p) => ({ ...p, water: t }))}
                    />
                    {/* coluna fantasma para manter o grid de 2 alinhado */}
                    <View style={styles.targetCol} />
                  </View>
                </View>
              </View>
            ) : null}

            {step === 2 ? (
              // --- Passo 2: lista editável de refeições ---
              <View style={styles.form}>
                <AppText variant="eyebrow" color="tertiary">
                  Refeições
                </AppText>

                {meals.length === 0 ? (
                  <Card padding="lg">
                    <AppText variant="bodyMd" color="tertiary">
                      Nenhuma refeição ainda. Adicione a primeira abaixo.
                    </AppText>
                  </Card>
                ) : (
                  meals.map((m, i) => (
                    <MealEditRow
                      key={`${m.name}-${i}`}
                      name={m.name}
                      time={m.time}
                      kcal={m.kcal}
                      protein={m.protein}
                      carbs={m.carbs}
                      fat={m.fat}
                      position={i + 1}
                      canMoveUp={i > 0}
                      canMoveDown={i < meals.length - 1}
                      onEdit={() => openEditSheet(i)}
                      onRemove={() => removeMeal(i)}
                      onMoveUp={() => moveMeal(i, -1)}
                      onMoveDown={() => moveMeal(i, 1)}
                    />
                  ))
                )}

                <View style={styles.addBtn}>
                  <Button
                    variant="secondary"
                    label="Adicionar refeição"
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
                    Dieta
                  </AppText>
                  <AppText variant="h3">{name.trim()}</AppText>
                  {notes.trim() !== '' ? (
                    <AppText variant="bodySm" color="secondary">
                      {notes.trim()}
                    </AppText>
                  ) : null}
                </View>

                <AppText variant="eyebrow" color="tertiary">
                  {`${meals.length} ${meals.length === 1 ? 'refeição' : 'refeições'}`}
                </AppText>

                {meals.map((m, i) => (
                  <Card key={`${m.name}-${i}`} padding="md" style={styles.reviewRowExtra}>
                    <AppText variant="metaSmall" color="tertiary">
                      {m.time && m.time.trim() !== ''
                        ? m.time
                        : String(i + 1).padStart(2, '0')}
                    </AppText>
                    <AppText variant="bodyMd" style={styles.reviewName} numberOfLines={1}>
                      {m.name}
                    </AppText>
                    {m.kcal !== undefined ? (
                      <AppText variant="dataMed" color="neon">
                        {`${m.kcal} kcal`}
                      </AppText>
                    ) : null}
                  </Card>
                ))}

                {targetChips.length > 0 ? (
                  <View style={styles.reviewHead}>
                    <AppText variant="eyebrow" color="tertiary">
                      Metas do dia
                    </AppText>
                    <View style={styles.metaChips}>
                      {targetChips.map((c) => (
                        <Tag key={c.key} label={c.label} tone="neutral" />
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        )}
      </Animated.View>

      {!loadingDetail && !detailError ? (
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
                    if (meals.length === 0) {
                      Alert.alert(
                        'Dieta sem refeições',
                        'Adicione ao menos uma refeição antes de continuar.',
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
                  label="Salvar dieta"
                  loading={saving}
                  onPress={handleSave}
                />
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      <MealFormSheet
        visible={sheetOpen}
        initialValue={editIndex !== null ? meals[editIndex] : null}
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
  addBtn: {
    marginTop: theme.spacing.xs,
  },
  reviewHead: {
    gap: theme.spacing.xs,
  },
  targets: {
    gap: theme.spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  targetCol: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  targetInput: {
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
  metaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  reviewRowExtra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
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
