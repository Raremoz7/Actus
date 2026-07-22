import { useEffect, useRef, useState } from 'react';

export type UnitOption = { id: string; name: string; type?: string | null };

// [ACTUS — TEC-79] Filtro de unidade (academia/filial/franquia) do dashboard do gestor.
// value=null => visão consolidada ("Todas as unidades").
export function UnitFilter({
  units, value, onChange,
}: {
  units: UnitOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const selected = value == null ? null : units.find((u) => u.id === value) ?? null;
  const label = selected ? selected.name : 'Todas as unidades';

  function choose(id: string | null) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-[30px] items-center gap-2 rounded-full border border-outline-v bg-surface-1 px-3 text-[13px] text-text-1 transition-colors hover:border-outline"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon" aria-hidden>
          <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
        </svg>
        <span>{label}</span>
        <span className="text-[9px] text-text-3">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 flex min-w-64 flex-col gap-0.5 rounded-xl border border-outline-v bg-surface-2 p-1.5 shadow-dropdown">
          <button
            type="button"
            onClick={() => choose(null)}
            className={`flex flex-col items-start gap-px rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-3 ${value == null ? 'bg-neon/10 text-neon' : 'text-text-1'}`}
          >
            Todas as unidades
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">Visão consolidada</span>
          </button>
          {units.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => choose(u.id)}
              className={`flex flex-col items-start gap-px rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-3 ${value === u.id ? 'bg-neon/10 text-neon' : 'text-text-1'}`}
            >
              {u.name}
              {u.type ? <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">{u.type}</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
