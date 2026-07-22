import { useMemo } from 'react';
import type { TextInputProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Input } from '@/components/ui';
import { maskCpf, maskPhone, onlyDigits } from '@/lib/format';

type MaskKind = 'cpf' | 'phone';

type MaskedFieldProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'keyboardType'
> & {
  // Valor cru no formulário: apenas dígitos.
  value: string;
  // Recebe sempre o valor já normalizado para dígitos.
  onChangeText: (digits: string) => void;
  mask: MaskKind;
  label: string;
  error?: string;
};

const MASKERS: Record<MaskKind, (v: string) => string> = {
  cpf: maskCpf,
  phone: maskPhone,
};

const MAX_DIGITS: Record<MaskKind, number> = {
  cpf: 11,
  phone: 11,
};

// Input mascarado para CPF/telefone: exibe pontuação mas guarda só dígitos no form.
export function MaskedField({
  value,
  onChangeText,
  mask,
  label,
  error,
  ...rest
}: MaskedFieldProps) {
  const masked = useMemo(() => MASKERS[mask](value), [mask, value]);

  function handleChangeText(text: string) {
    // Normaliza para dígitos antes de guardar; corta no tamanho da máscara.
    const digits = onlyDigits(text).slice(0, MAX_DIGITS[mask]);
    onChangeText(digits);
  }

  return (
    <Input
      label={label}
      error={error}
      value={masked}
      onChangeText={handleChangeText}
      keyboardType="number-pad"
      accessibilityLabel={label}
      style={styles.mono}
      {...rest}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  mono: {
    fontFamily: theme.fontFamily.mono,
  },
}));
