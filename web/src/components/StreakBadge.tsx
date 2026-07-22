// Gamificação V1 (Task 20): exibe a sequência de dias (streak) do aluno para o
// Personal. Sem emoji — segue o design system quiet luxury do web (ícone inline +
// tokens de cor). Apagado (text-text-3) quando a sequência está quebrada.
export function StreakBadge({ streak, isBroken }: { streak: number; isBroken?: boolean }) {
  if (!streak || streak <= 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs tabular-nums ${
        isBroken ? 'text-text-3' : 'text-warning'
      }`}
      title={isBroken ? 'Sequência quebrada' : 'Sequência de dias'}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="currentColor"
      >
        <path d="M12 2c.5 3-1.5 4.5-3 6.5C7.5 10.5 6 12.5 6 15a6 6 0 0 0 12 0c0-2-.8-3.7-2-5 .3 1.2-.2 2.3-1 2.8.4-2.3-.7-4.6-2.5-6C13.8 5.2 13 3.4 12 2Z" />
      </svg>
      <span className={isBroken ? '' : 'font-semibold'}>{streak}</span>
    </span>
  );
}
