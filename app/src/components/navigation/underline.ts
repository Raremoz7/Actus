// Posição X (px, a partir da esquerda da barra) do sublinhado neon sob a aba
// ativa, centralizado dentro da coluna da aba. Pura → testável sem render.
export function underlineTranslateX(
  activeIndex: number,
  barWidth: number,
  tabCount: number,
  underlineWidth: number,
): number {
  if (barWidth <= 0 || tabCount <= 0) return 0;
  const tabWidth = barWidth / tabCount;
  return activeIndex * tabWidth + (tabWidth - underlineWidth) / 2;
}
