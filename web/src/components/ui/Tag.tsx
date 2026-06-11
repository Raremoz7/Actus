import type { HTMLAttributes } from 'react';

type Variant = 'default' | 'active' | 'warn' | 'error';

const variants: Record<Variant, string> = {
  default: 'bg-surface-2 text-on-surface',
  active: 'bg-neon/15 text-neon',
  warn: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
};

type Props = HTMLAttributes<HTMLSpanElement> & { variant?: Variant };

export function Tag({ variant = 'default', className = '', ...rest }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-xs uppercase ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}
