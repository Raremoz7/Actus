import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = '', ...rest }: Props) {
  return <div className={`animate-pulse rounded-lg bg-surface-2 ${className}`} {...rest} />;
}
