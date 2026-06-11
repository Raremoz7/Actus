import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({ className = '', ...rest }: Props) {
  return (
    <div
      className={`rounded-xl border border-outline-v bg-surface-1 p-4 ${className}`}
      {...rest}
    />
  );
}
