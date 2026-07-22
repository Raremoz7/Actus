import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import type { TextInputProps } from 'react-native';

import { Input } from '@/components/ui';

type FormFieldProps<T extends FieldValues> = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onBlur'
> & {
  // Control do react-hook-form, tipado pelo schema do formulário.
  control: Control<T>;
  // Nome do campo — restrito às chaves válidas de T.
  name: Path<T>;
  // Label eyebrow mono renderizado pelo átomo Input.
  label: string;
  // Mensagem de erro (vem do formState.errors[name]?.message).
  error?: string;
  // Repassado ao Input — anunciado só pro leitor de tela (accessibleFieldLabel).
  required?: boolean;
};

// Wrapper que conecta o átomo Input ao react-hook-form via Controller.
// Mantém o label eyebrow mono e a mensagem de erro do próprio Input.
export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  required,
  ...inputProps
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <Input
          label={label}
          error={error}
          required={required}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          onBlur={onBlur}
          {...inputProps}
        />
      )}
    />
  );
}
