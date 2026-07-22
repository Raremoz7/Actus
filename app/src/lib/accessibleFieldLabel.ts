// Monta o accessibilityLabel de um campo de formulário incluindo obrigatoriedade
// e erro no próprio nome acessível — assim um leitor de tela sempre anuncia os
// três juntos ao focar o campo, independente de plataforma (o texto de erro
// visual sozinho depende de accessibilityLiveRegion, que só funciona no Android).
export function accessibleFieldLabel(
  label?: string,
  error?: string | null,
  required?: boolean,
): string | undefined {
  const parts = [label];
  if (required) parts.push('campo obrigatório');
  if (error) parts.push(`erro: ${error}`);
  return parts.filter(Boolean).join('. ') || undefined;
}
