import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex items-center justify-center gap-2 font-display font-black uppercase tracking-wide transition-colors disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'rounded-full bg-neon text-text-inv px-6 py-2.5 text-sm hover:brightness-95',
  secondary:
    'rounded-xl border border-outline text-text-1 px-6 py-2.5 text-sm hover:border-neon hover:text-neon',
  ghost: 'rounded-lg text-text-2 px-4 py-2 text-sm hover:text-text-1 hover:bg-surface-2',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = 'primary', className = '', ...rest }: Props) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}
