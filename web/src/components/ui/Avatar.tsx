const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
} as const;

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = 'md' }: { name: string | null; size?: keyof typeof sizes }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-surface-3 font-display font-bold text-text-1 ${sizes[size]}`}
    >
      {initials(name)}
    </span>
  );
}
