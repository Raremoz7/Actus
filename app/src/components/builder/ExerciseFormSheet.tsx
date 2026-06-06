import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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

// Dados que o sheet devolve ao confirmar. Sem position/wger_exercise_id: esses
// são responsabilidade do builder (placeholder Wger + ordem sequencial).
export type ExerciseFormValue = {
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  notes: string | null;
};

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

// BOTTOM SHEET com formulário manual de exercício.
// NOTA WGER: não há busca de catálogo Wger na API v1 — o profissional digita o
// NOME do exercício; o builder usa wger_exercise_id=1 como placeholder.
// [MOCK — sem busca Wger na API v1: id placeholder; nome digitado manualmente]
export function ExerciseFormSheet({
  visible,
  initialValue,
  onClose,
  onConfirm,
}: ExerciseFormSheetProps) {
  const [name, setName] = useState('');
  const [sets, setSets] = useState(DEFAULT_SETS);
  const [reps, setReps] = useState(DEFAULT_REPS);
  const [rest, setRest] = useState(DEFAULT_REST);
  const [notes, setNotes] = useState('');
  // Só mostra erros depois de uma tentativa de confirmar (validação discreta).
  const [submitted, setSubmitted] = useState(false);

  // Reseta/preenche os campos sempre que o sheet abre.
  useEffect(() => {
    if (!visible) return;
    setName(initialValue?.name ?? '');
    setSets(initialValue ? String(initialValue.sets) : DEFAULT_SETS);
    setReps(initialValue ? String(initialValue.reps) : DEFAULT_REPS);
    setRest(initialValue ? String(initialValue.restSeconds) : DEFAULT_REST);
    setNotes(initialValue?.notes ?? '');
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

  const parsed = useMemo(
    () => ({
      sets: toInt(sets),
      reps: toInt(reps),
      rest: toInt(rest),
    }),
    [sets, reps, rest],
  );

  const nameTrimmed = name.trim();
  const errors = {
    name: nameTrimmed.length === 0,
    sets: !inRange(parsed.sets, LIMITS.sets.min, LIMITS.sets.max),
    reps: !inRange(parsed.reps, LIMITS.reps.min, LIMITS.reps.max),
    rest: !inRange(parsed.rest, LIMITS.rest.min, LIMITS.rest.max),
  };
  const hasError = errors.name || errors.sets || errors.reps || errors.rest;

  function handleConfirm() {
    setSubmitted(true);
    if (hasError) return;
    onConfirm({
      name: nameTrimmed,
      sets: parsed.sets as number,
      reps: parsed.reps as number,
      restSeconds: parsed.rest as number,
      notes: notes.trim() === '' ? null : notes.trim(),
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
                {isEditing ? 'Editar exercício' : 'Adicionar exercício'}
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

            <Input
              label="Exercício"
              accessibilityLabel="Exercício"
              placeholder="Ex.: Supino reto"
              value={name}
              onChangeText={setName}
              autoCapitalize="sentences"
              error={submitted && errors.name ? 'Informe o nome do exercício' : undefined}
            />

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
