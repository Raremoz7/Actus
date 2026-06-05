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
import { MealEditRow, MealFormSheet, type MealFormValue } from '@/components/diet';
import { useDietTemplateDetail } from '@/hooks/useDietTemplateDetail';
import { useDietMutations } from '@/hooks/useDietMutations';
import { parseDietBody, type Meal } from '@/types/diets';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// Refeição no estado local do builder — mesma forma do MealFormValue/Meal.
type DraftMeal = MealFormValue;

type Step = 1 | 2 | 3;

// Converte o estado local em meals[] do corpo da API (DietBodySchema). Macros
// opcionais já vêm ausentes do sheet; aqui só repassamos.
function toMeals(drafts: DraftMeal[]): Meal[] {
  return drafts.map((d) => ({
    name: d.name,
    ...(d.foods === undefined ? {} : { foods: d.foods }),
    ...(d.kcal === undefined ? {} : { kcal: d.kcal }),
    ...(d.protein === undefined ? {} : { protein: d.protein }),
    ...(d.carbs === undefined ? {} : { carbs: d.carbs }),
    ...(d.fat === undefined ? {} : { fat: d.fat }),
  }));
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
        foods: m.foods,
        kcal: m.kcal,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
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
    if (isEditing) return 'Editar dieta';
    return `Passo ${step} de 3`;
  }, [isEditing, step]);

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
    const body = {
      meals: toMeals(meals),
      ...(trimmedNotes === '' ? {} : { notes: trimmedNotes }),
    };

    if (isEditing && editingId) {
      update.mutate(
        { id: editingId, body: { name: trimmedName, body } },
        {
          onSuccess: () => handleBack(),
          onError: () =>
            Alert.alert('Não foi possível salvar', 'Tente novamente em instantes.'),
        },
      );
      return;
    }

    create.mutate(
      { name: trimmedName, body },
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
              </View>
            ) : null}

            {step === 2 ? (
              // --- Passo 2: lista editável de refeições ---
              <View style={styles.form}>
                <AppText variant="eyebrow" color="tertiary">
                  Refeições
                </AppText>

                {meals.length === 0 ? (
                  <View style={styles.empty}>
                    <AppText variant="bodyMd" color="tertiary">
                      Nenhuma refeição ainda. Adicione a primeira abaixo.
                    </AppText>
                  </View>
                ) : (
                  meals.map((m, i) => (
                    <MealEditRow
                      key={`${m.name}-${i}`}
                      name={m.name}
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
                  <View key={`${m.name}-${i}`} style={styles.reviewRow}>
                    <AppText variant="metaSmall" color="tertiary">
                      {String(i + 1).padStart(2, '0')}
                    </AppText>
                    <AppText variant="bodyMd" style={styles.reviewName} numberOfLines={1}>
                      {m.name}
                    </AppText>
                    {m.kcal !== undefined ? (
                      <AppText variant="dataMed" color="neon">
                        {`${m.kcal} kcal`}
                      </AppText>
                    ) : null}
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
