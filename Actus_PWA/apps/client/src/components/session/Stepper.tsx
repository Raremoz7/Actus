import { Pressable, TextInput, View } from 'react-native';
import { Minus, Plus } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

// Campo numérico-herói com steppers (+/-). Edição livre pelo teclado e
// ajuste fino pelos botões. value é string controlada (permite vazio "").
type StepperProps = {
  label: string;
  unit: string;
  value: string;
  onChange: (next: string) => void;
  // Incremento por toque no +/-. Peso costuma andar de 2.5 em 2.5; reps de 1 em 1.
  step: number;
  // Casas decimais a manter ao sair de um passo (peso: 1; reps: 0).
  decimals?: number;
  accessibilityLabel: string;
};

// Soma um passo respeitando vírgula/ponto e mantendo string limpa (sem ".0" cru).
function applyStep(value: string, delta: number, decimals: number): string {
  const current = value.trim() === '' ? 0 : Number(value.replace(',', '.'));
  const base = Number.isFinite(current) ? current : 0;
  const next = Math.max(0, base + delta);
  const rounded = Number(next.toFixed(decimals));
  return String(rounded);
}

export function Stepper({
  label,
  unit,
  value,
  onChange,
  step,
  decimals = 0,
  accessibilityLabel,
}: StepperProps) {
  return (
    <View style={styles.box}>
      <AppText variant="eyebrow" color="tertiary">
        {label}
      </AppText>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${label.toLowerCase()}`}
          hitSlop={8}
          onPress={() => onChange(applyStep(value, -step, decimals))}
          style={styles.stepBtn}
        >
          <Minus size={16} weight="bold" color={colors.textSecondary} />
        </Pressable>

        <TextInput
          accessibilityLabel={accessibilityLabel}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          selectTextOnFocus
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label.toLowerCase()}`}
          hitSlop={8}
          onPress={() => onChange(applyStep(value, step, decimals))}
          style={styles.stepBtn}
        >
          <Plus size={16} weight="bold" color={colors.textSecondary} />
        </Pressable>
      </View>
      <AppText variant="metaSmall" color="tertiary">
        {unit}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  box: {
    flex: 1,
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.input,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.typeScale.inputHero,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    padding: 0,
  },
}));
