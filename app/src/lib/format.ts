// Mantém apenas dígitos (0-9) de uma string. Base das máscaras.
export function onlyDigits(v: string): string {
  return v.replace(/\D+/g, '');
}

// Formata uma data como YYYY-MM-DD no FUSO LOCAL.
// NUNCA usar toISOString aqui: ele converte para UTC e, em UTC-3, "vira" o dia
// para datas perto da meia-noite (bug clássico de check-in no dia errado).
export function formatDateLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Máscara progressiva de CPF: 000.000.000-00.
// Aplica a pontuação conforme os dígitos chegam, sem exigir o valor completo.
export function maskCpf(v: string): string {
  const digits = onlyDigits(v).slice(0, 11);
  let out = digits.slice(0, 3);
  if (digits.length > 3) out += `.${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `.${digits.slice(6, 9)}`;
  if (digits.length > 9) out += `-${digits.slice(9, 11)}`;
  return out;
}

// Máscara progressiva de data BR: DD/MM/AAAA.
// Aplica as barras conforme os dígitos chegam, sem exigir a data completa.
export function maskDateBr(v: string): string {
  const digits = onlyDigits(v).slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += `/${digits.slice(2, 4)}`;
  if (digits.length > 4) out += `/${digits.slice(4, 8)}`;
  return out;
}

// Converte 8 dígitos (DDMMAAAA) em YYYY-MM-DD, ou null se incompleto/inválido.
// Rejeita datas que "transbordam" (ex.: 31/02 vira 03/03) comparando os
// componentes de volta com o Date construído.
export function isoFromBrDigits(v: string): string | null {
  const digits = onlyDigits(v);
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return formatDateLocal(d);
}

// Máscara progressiva de telefone (celular): (00) 00000-0000.
export function maskPhone(v: string): string {
  const digits = onlyDigits(v).slice(0, 11);
  if (digits.length === 0) return '';
  let out = `(${digits.slice(0, 2)}`;
  if (digits.length >= 2) out += ') ';
  out += digits.slice(2, 7);
  if (digits.length > 7) out += `-${digits.slice(7, 11)}`;
  return out;
}
