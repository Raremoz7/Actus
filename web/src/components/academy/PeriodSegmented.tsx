// [ACTUS — TEC-79] Controle visual de período. Sem efeito de dados nesta fase (backend não
// aceita parâmetro de período) — estado local apenas, para bater com o design aprovado.
export type Period = 'month' | 'last_month' | '90d';

const OPTIONS: { value: Period; label: string }[] = [
  { value: 'month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: '90d', label: '90 dias' },
];

export function PeriodSegmented({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="inline-flex gap-0.5 rounded-full border border-outline-v bg-surface-1 p-[3px]">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-[5px] font-mono text-[11px] uppercase tracking-wide transition-colors ${
            value === o.value ? 'bg-neon text-text-inv' : 'text-text-3 hover:text-text-1'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
