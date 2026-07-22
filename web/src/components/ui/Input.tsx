import { forwardRef, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, className = '', id, ...rest },
  ref,
) {
  const inputEl = (
    <input
      ref={ref}
      id={id}
      className={`rounded-xl border px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus:outline-none disabled:opacity-50 ${
        error
          ? 'border-error focus:border-error'
          : 'border-outline-v bg-surface-1 focus:border-neon'
      } ${className}`}
      {...rest}
    />
  );

  if (!label && !error) return inputEl;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="font-mono text-eyebrow uppercase tracking-widest text-text-3">
          {label}
        </label>
      )}
      {inputEl}
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
});
