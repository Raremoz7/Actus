import type { ReactNode } from 'react';

// Header padrão de página: h-header (52px), borda inferior, título + slots opcionais
// de badges (children, ao lado do título) e ações (actions, alinhadas à direita).
// Consolida o padrão `h-[52px] ... border-b border-outline-v px-6` repetido em ~22 páginas.
export function PageHeader({
  title,
  before,
  children,
  actions,
  wrap = false,
  className = '',
}: {
  title?: ReactNode;
  /** Conteúdo antes do título (ex.: link "‹ Voltar"). */
  before?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  /** Header denso (busca + filtros inline) que precisa quebrar linha em telas estreitas. */
  wrap?: boolean;
  /** Classes extras (ex.: shrink-0 dentro de um flex-col com overflow). */
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 border-b border-outline-v px-6 ${
        wrap ? 'min-h-header flex-wrap py-2.5' : 'h-header'
      } ${actions ? 'justify-between' : ''} ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {before}
        {title != null && (
          <h1 className="truncate font-display text-xl font-black uppercase tracking-wide text-text-1">
            {title}
          </h1>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-2.5">{actions}</div>
      )}
    </div>
  );
}
