import type { HTMLAttributes, ElementType } from 'react';

// Nome escolhido: "Eyebrow" (não "Label") porque o uso predominante no projeto é o
// rótulo pequeno acima/ao lado de um valor (padrão "eyebrow text" de design systems),
// não o <label> semântico de formulário — esse continua sendo o atributo nativo `label`
// do componente Input. Consolida o padrão `text-[10px] uppercase tracking-widest/wider
// text-text-3` (por vezes com font-mono, por vezes sem) repetido em ~14 arquivos.
// Padronizamos tracking-widest (era o mais comum nos exemplos auditados; tracking-wider
// aparecia em menos lugares sem critério aparente).
type Props = HTMLAttributes<HTMLElement> & { as?: ElementType };

export function Eyebrow({ as: Component = 'span', className = '', ...rest }: Props) {
  return (
    <Component
      className={`font-mono text-eyebrow uppercase tracking-widest text-text-3 ${className}`}
      {...rest}
    />
  );
}
