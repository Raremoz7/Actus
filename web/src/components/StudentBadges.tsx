// Gamificação V1 (Task 20): total de conquistas (badges) do aluno, exibido para o
// Personal. Sem emoji — ícone inline (troféu) + tokens do design system.
export function StudentBadges({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-text-2"
      title="Conquistas"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="currentColor"
      >
        <path d="M6 3h12v2h3v3a4 4 0 0 1-4 4h-.3A6 6 0 0 1 13 15.9V18h3v2H8v-2h3v-2.1A6 6 0 0 1 7.3 12H7a4 4 0 0 1-4-4V5h3V3Zm0 4H5v1a2 2 0 0 0 1 1.7V7Zm12 0v2.7A2 2 0 0 0 19 8V7h-1Z" />
      </svg>
      <span>{count}</span>
    </span>
  );
}
