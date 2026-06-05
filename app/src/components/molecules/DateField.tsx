import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Input } from '@/components/ui';
import {
  formatDateLocal,
  isoFromBrDigits,
  maskDateBr,
  onlyDigits,
} from '@/lib/format';

type DateFieldProps = {
  // Data no formato YYYY-MM-DD (ou null quando ainda não escolhida).
  value: string | null;
  onChange: (value: string) => void;
  // Label eyebrow mono acima do campo.
  label: string;
  error?: string;
  // Limites do picker (data-only LOCAL, sem UTC). Contrato do teto:
  //   prop ausente (undefined) → teto = HOJE (caso nascimento, padrão).
  //   maximumDate={null}        → sem teto (datas futuras, ex.: período de desafio).
  //   maximumDate={Date}        → teto explícito.
  minimumDate?: Date;
  maximumDate?: Date | null;
};

// Converte "YYYY-MM-DD" em Date usando componentes LOCAIS (evita o parse UTC
// implícito de `new Date("2000-01-01")`, que volta um dia em fusos negativos).
function parseLocalDate(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

// Exibe DD/MM/AAAA a partir de um Date local.
function displayDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Converte YYYY-MM-DD em DD/MM/AAAA para preencher o input web.
function brFromIso(value: string | null): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

// WEB: o DateTimePicker nativo não funciona no navegador. Renderiza um input
// mascarado (DD/MM/AAAA) digitável; só emite o YYYY-MM-DD quando a data é real
// e dentro dos limites — respeita o mesmo contrato de teto/piso do nativo
// (maximumDate undefined → HOJE; null → sem teto; Date → explícito).
function DateFieldWeb({ value, onChange, label, error, minimumDate, maximumDate }: DateFieldProps) {
  const [text, setText] = useState(() => brFromIso(value));

  function handleText(input: string) {
    const digits = onlyDigits(input).slice(0, 8);
    setText(maskDateBr(digits));
    const iso = isoFromBrDigits(digits);
    if (!iso) {
      onChange('');
      return;
    }
    const maxIso =
      maximumDate === undefined
        ? formatDateLocal(new Date())
        : maximumDate
          ? formatDateLocal(maximumDate)
          : null;
    const minIso = minimumDate ? formatDateLocal(minimumDate) : null;
    const okMax = maxIso === null || iso <= maxIso;
    const okMin = minIso === null || iso >= minIso;
    onChange(okMax && okMin ? iso : '');
  }

  return (
    <Input
      label={label}
      error={error}
      value={text}
      onChangeText={handleText}
      placeholder="DD/MM/AAAA"
      keyboardType="number-pad"
      inputMode="numeric"
      maxLength={10}
      accessibilityLabel={label}
      style={styles.webInput}
    />
  );
}

export function DateField(props: DateFieldProps) {
  if (Platform.OS === 'web') {
    return <DateFieldWeb {...props} />;
  }
  return <DateFieldNative {...props} />;
}

function DateFieldNative({
  value,
  onChange,
  label,
  error,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);

  const selected = parseLocalDate(value);
  const today = new Date();
  const hasError = Boolean(error);
  // Contrato do teto (ver DateFieldProps): undefined → HOJE; null → sem teto.
  const effectiveMaximum =
    maximumDate === undefined ? today : (maximumDate ?? undefined);

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    // No Android o picker é um diálogo: fecha em qualquer ação.
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (date) {
      // formatDateLocal usa componentes locais — nunca toISOString.
      onChange(formatDateLocal(date));
    }
  }

  return (
    <View style={styles.wrapper}>
      <AppText variant="eyebrow" color="tertiary" style={styles.label}>
        {label}
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={selected ? { text: displayDate(selected) } : undefined}
        onPress={() => setOpen(true)}
        style={[styles.field, hasError ? styles.fieldError : null]}
      >
        <AppText
          variant="dataMed"
          color={selected ? 'primary' : 'tertiary'}
          style={styles.value}
        >
          {selected ? displayDate(selected) : 'DD/MM/AAAA'}
        </AppText>
      </Pressable>

      {hasError ? (
        <AppText variant="bodySm" color="error" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      {open ? (
        <DateTimePicker
          value={selected ?? today}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          maximumDate={effectiveMaximum}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    alignSelf: 'stretch',
    gap: theme.spacing.xs,
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  fieldError: {
    borderColor: theme.colors.error,
  },
  value: {
    flex: 1,
  },
  error: {
    marginTop: theme.spacing.xs,
  },
  webInput: {
    fontFamily: theme.fontFamily.mono,
    letterSpacing: 1,
  },
}));
