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
import { X } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// Dados que o sheet devolve ao confirmar — espelha o MealSchema (DietBodySchema).
// Macros são OPCIONAIS: ausentes quando o campo fica vazio (não inventar zeros).
export type MealFormValue = {
  name: string;
  foods?: string;
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type MealFormSheetProps = {
  visible: boolean;
  // Valor inicial para edição; ausente = adicionar (campos vazios).
  initialValue?: MealFormValue | null;
  onClose: () => void;
  onConfirm: (value: MealFormValue) => void;
};

// Aceita só dígitos; devolve int ou null se vazio. Macros são números >= 0.
function toIntOrNull(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits === '') return null;
  return Number.parseInt(digits, 10);
}

// Converte número opcional do valor inicial em string de campo (vazio quando ausente).
function numToField(n: number | undefined): string {
  return n === undefined ? '' : String(n);
}

// Campo numérico compacto (kcal / P / C / G) usado em duas linhas de dois campos.
function MacroField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.macroCol}>
      <AppText variant="eyebrow" color="tertiary">
        {label}
      </AppText>
      <TextInput
        style={styles.macroInput}
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

// BOTTOM SHEET com formulário de refeição. Nome obrigatório; alimentos em texto
// livre multi-linha; macros (kcal/proteína/carbo/gordura) numéricos OPCIONAIS.
export function MealFormSheet({
  visible,
  initialValue,
  onClose,
  onConfirm,
}: MealFormSheetProps) {
  const [name, setName] = useState('');
  const [foods, setFoods] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  // Só mostra o erro de nome depois de uma tentativa de confirmar.
  const [submitted, setSubmitted] = useState(false);

  // Reseta/preenche os campos sempre que o sheet abre.
  useEffect(() => {
    if (!visible) return;
    setName(initialValue?.name ?? '');
    setFoods(initialValue?.foods ?? '');
    setKcal(numToField(initialValue?.kcal));
    setProtein(numToField(initialValue?.protein));
    setCarbs(numToField(initialValue?.carbs));
    setFat(numToField(initialValue?.fat));
    setSubmitted(false);
  }, [visible, initialValue]);

  // ÚNICA animação do sheet: slide/fade de entrada (300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(visible ? 1 : 0, { duration: motion.screenMs });
  }, [visible, reveal]);
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 24 }],
  }));

  const nameTrimmed = name.trim();
  const nameError = nameTrimmed.length === 0;

  const parsedMacros = useMemo(
    () => ({
      kcal: toIntOrNull(kcal),
      protein: toIntOrNull(protein),
      carbs: toIntOrNull(carbs),
      fat: toIntOrNull(fat),
    }),
    [kcal, protein, carbs, fat],
  );

  function handleConfirm() {
    setSubmitted(true);
    if (nameError) return;

    const foodsTrimmed = foods.trim();
    const value: MealFormValue = {
      name: nameTrimmed,
      ...(foodsTrimmed === '' ? {} : { foods: foodsTrimmed }),
      ...(parsedMacros.kcal === null ? {} : { kcal: parsedMacros.kcal }),
      ...(parsedMacros.protein === null ? {} : { protein: parsedMacros.protein }),
      ...(parsedMacros.carbs === null ? {} : { carbs: parsedMacros.carbs }),
      ...(parsedMacros.fat === null ? {} : { fat: parsedMacros.fat }),
    };
    onConfirm(value);
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
                {isEditing ? 'Editar refeição' : 'Adicionar refeição'}
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

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Input
                label="Refeição"
                accessibilityLabel="Refeição"
                placeholder="Ex.: Café da manhã"
                value={name}
                onChangeText={setName}
                autoCapitalize="sentences"
                error={submitted && nameError ? 'Informe o nome da refeição' : undefined}
              />

              <Input
                label="Alimentos · opcional"
                accessibilityLabel="Alimentos"
                placeholder="Ovos, aveia, fruta…"
                value={foods}
                onChangeText={setFoods}
                autoCapitalize="sentences"
                multiline
                style={styles.foodsInput}
              />

              <View style={styles.macroRow}>
                <MacroField label="Kcal" value={kcal} onChangeText={setKcal} />
                <MacroField label="Proteína (g)" value={protein} onChangeText={setProtein} />
              </View>
              <View style={styles.macroRow}>
                <MacroField label="Carbo (g)" value={carbs} onChangeText={setCarbs} />
                <MacroField label="Gordura (g)" value={fat} onChangeText={setFat} />
              </View>
            </ScrollView>

            <View style={styles.cta}>
              <Button
                variant="primary"
                label={isEditing ? 'Salvar refeição' : 'Adicionar'}
                onPress={handleConfirm}
              />
            </View>
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
  scroll: {
    alignSelf: 'stretch',
  },
  scrollContent: {
    gap: theme.spacing.lg,
  },
  foodsInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  macroRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  macroCol: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  macroInput: {
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
  cta: {
    marginTop: theme.spacing.xs,
  },
}));
