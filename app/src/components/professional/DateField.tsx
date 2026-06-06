import { useState } from 'react';

import { Input } from '@/components/ui';
import { isoFromBrDigits, maskDateBr, onlyDigits, shortDateBr } from '@/lib/format';

type Props = {
  label?: string;
  // Valor inicial em ISO 'YYYY-MM-DD' (ex.: hoje). Semente do campo mascarado.
  initialIso: string;
  // Emite o ISO válido ('YYYY-MM-DD') ou null enquanto a data está incompleta/inválida.
  onChangeIso: (iso: string | null) => void;
};

// Converte ISO 'YYYY-MM-DD' → texto mascarado BR 'DD/MM/AAAA' (por componentes, sem Date).
function isoToBrMasked(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '';
  return maskDateBr(`${m[3]}${m[2]}${m[1]}`);
}

// Campo de data com máscara BR (DD/MM/AAAA) sobre o Input da fundação.
// Emite o ISO de volta (formatDateLocal-friendly) — nunca toISOString.
// Marca a borda como inválida quando há 8 dígitos mas a data não é real.
export function DateField({ label, initialIso, onChangeIso }: Props) {
  const [text, setText] = useState(() => isoToBrMasked(initialIso));

  function handleChange(raw: string) {
    const masked = maskDateBr(raw);
    setText(masked);
    onChangeIso(isoFromBrDigits(masked));
  }

  const digits = onlyDigits(text);
  // Inválido só quando a data está "completa" (8 dígitos) mas não casa (ex.: 31/02).
  const invalid = digits.length === 8 && isoFromBrDigits(text) === null;

  return (
    <Input
      label={label}
      value={text}
      onChangeText={handleChange}
      placeholder="DD/MM/AAAA"
      keyboardType="number-pad"
      maxLength={10}
      invalid={invalid}
    />
  );
}

// Reexporta o rótulo curto para quem quiser exibir a data escolhida ("01 jun").
export { shortDateBr };
