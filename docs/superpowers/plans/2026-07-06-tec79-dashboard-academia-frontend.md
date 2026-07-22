# TEC-79 — Dashboard da Academia (Frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Aplicar os 4 deltas da TEC-79 sobre o dashboard rico já existente (`web/src/pages/academia/AcademyDashboardPage.tsx`): filtro de unidade + período no header, hover no gráfico de dias da semana, remoção de Comissões (já feita), e ajuste de layout.

**Architecture:** Web React + TS + Tailwind v4 (`@theme` em `web/src/index.css`) + TanStack Query + Zod. Gráficos SVG próprios em `web/src/components/ui/charts.tsx`. Mocks em `web/src/mocks/academyInsights.ts`. Testes: vitest + @testing-library/react (infra já existe).

**Já feito fora do plano:** remoção do item "Comissões" em `web/src/layouts/AcademyLayout.tsx`.

---

## Task 1: `WeekdayLineChart` — gráfico de dias da semana com hover

**Files:**
- Modify: `web/src/components/ui/charts.tsx` (adicionar `WeekdayLineChart`)
- Test: `web/src/components/ui/charts.test.tsx` (novo)
- Modify: `web/src/pages/academia/AcademyDashboardPage.tsx` (trocar o card "Alunos por dia da semana" de `MultiLineChart` para `WeekdayLineChart`)

- [ ] **Step 1: Escrever o teste (falha esperada)**

```tsx
// web/src/components/ui/charts.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeekdayLineChart } from './charts';

const props = {
  xLabels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  fullLabels: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'],
  series: [
    { label: 'Masculino', color: 'var(--color-data-1)', values: [61, 54, 58, 49, 63, 38, 12] },
    { label: 'Feminino', color: 'var(--color-data-4)', values: [72, 66, 69, 58, 55, 47, 18] },
  ],
};

describe('WeekdayLineChart', () => {
  it('renderiza os labels curtos dos dias', () => {
    render(<WeekdayLineChart {...props} />);
    expect(screen.getByText('Seg')).toBeInTheDocument();
    expect(screen.getByText('Dom')).toBeInTheDocument();
  });

  it('mostra tooltip com dia, categorias e total ao passar o mouse numa coluna', () => {
    const { container } = render(<WeekdayLineChart {...props} />);
    const cols = container.querySelectorAll('[data-hover-col]');
    expect(cols.length).toBe(7);
    fireEvent.mouseEnter(cols[4]); // Sexta
    expect(screen.getByText('Sexta-feira')).toBeInTheDocument();
    expect(screen.getByText('Masculino')).toBeInTheDocument();
    expect(screen.getByText('Feminino')).toBeInTheDocument();
    expect(screen.getByText('63')).toBeInTheDocument(); // masc sexta
    expect(screen.getByText('55')).toBeInTheDocument(); // fem sexta
    expect(screen.getByText('118')).toBeInTheDocument(); // total
  });

  it('esconde o tooltip ao sair do gráfico', () => {
    const { container } = render(<WeekdayLineChart {...props} />);
    const plot = container.querySelector('[data-plot]')!;
    const cols = container.querySelectorAll('[data-hover-col]');
    fireEvent.mouseEnter(cols[0]);
    expect(screen.getByText('Segunda-feira')).toBeInTheDocument();
    fireEvent.mouseLeave(plot);
    expect(screen.queryByText('Segunda-feira')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar o teste, confirmar que falha**

Run: `cd web && npx vitest run src/components/ui/charts.test.tsx`
Expected: FAIL — `WeekdayLineChart` não existe.

- [ ] **Step 3: Implementar `WeekdayLineChart` em `charts.tsx`**

Adicionar ao fim de `web/src/components/ui/charts.tsx`. Requisitos:
- Props: `{ xLabels: string[]; fullLabels: string[]; series: { label: string; color: string; values: number[] }[]; height?: number; className?: string }`.
- Layout: um container `data-plot` com `position: relative`. Dentro:
  - Um `<svg>` só para as **linhas** (polylines), com `preserveAspectRatio="none"` e `vector-effect="non-scaling-stroke"` nas linhas (linhas podem esticar sem prejuízo). Sistema de coords `viewBox="0 0 100 100"`; banda vertical útil `padT=12`, `padB=88` (em %). `x(i)= i/(n-1)*100`; `y(v)= padT + (1 - v/max) * (padB - padT)`, com `max = Math.max(1, ...todos os valores)`.
  - Uma camada HTML sobreposta (`position:absolute; inset:0`) com os **pontos** (um `<i>` por série por dia) posicionados por `left:x%` / `top:y%` e `translate(-50%,-50%)` — assim ficam circulares (sem distorção do SVG). Cada ponto ganha classe destacada quando o dia está ativo.
  - Uma **guia vertical** (div 1px) que aparece na coluna ativa.
  - `n` colunas de hover invisíveis (`data-hover-col`, uma por dia), largura `100/n%`, centradas em `x(i)`, cobrindo toda a altura, com `onMouseEnter` setando o índice ativo.
  - Um **tooltip** HTML absoluto que, no dia ativo, mostra: `fullLabels[i]` (título), uma linha por série (`label` + valor com bolinha da cor), e uma linha "Total" (soma das séries). Posicionar `left` clampado em `[12, 88]%` e `top` no menor y das séries, com `transform: translate(-50%, calc(-100% - 12px))`.
- Estado: `const [active, setActive] = useState<number | null>(null)`. `onMouseLeave` no `data-plot` zera.
- Abaixo do plot, os `xLabels` (um `<span>` por dia, realçado quando ativo).
- Usar classes Tailwind e os tokens existentes (`text-text-*`, `bg-surface-3`, `border-outline-v`, etc.), no mesmo estilo do tooltip do protótipo `web/public/prototipo-dashboard-gerencial.html` (classes `.lc-*`).

Esqueleto de referência (adaptar para JSX/Tailwind):

```tsx
export type WeekdaySeries = { label: string; color: string; values: number[] };

export function WeekdayLineChart({
  xLabels,
  fullLabels,
  series,
  height = 172,
  className = '',
}: {
  xLabels: string[];
  fullLabels: string[];
  series: WeekdaySeries[];
  height?: number;
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const n = xLabels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const padT = 12, padB = 88;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => padT + (1 - v / max) * (padB - padT);

  return (
    <div className={className}>
      <div data-plot className="relative" style={{ height }} onMouseLeave={() => setActive(null)}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {/* linhas de grade + polylines por série (vector-effect non-scaling-stroke) */}
        </svg>
        {/* guia vertical (quando active != null) */}
        {/* pontos: series.map(s => s.values.map((v,i) => <i style={{left:`${x(i)}%`, top:`${y(v)}%`}} .../>)) */}
        {/* tooltip (quando active != null) com fullLabels[active], séries e total */}
        {/* colunas de hover: xLabels.map((_,i) => <div data-hover-col style={{left:`${x(i)}%`, width:`${100/n}%`}} onMouseEnter={() => setActive(i)}/>) */}
      </div>
      <div className="mt-2 flex justify-between">
        {xLabels.map((l, i) => (
          <span key={l} className={`flex-1 text-center font-mono text-[10px] ${active === i ? 'text-text-1' : 'text-text-3'}`}>{l}</span>
        ))}
      </div>
    </div>
  );
}
```

Importar `useState` no topo do arquivo (`import { useState } from 'react';`).

- [ ] **Step 4: Rodar o teste, confirmar que passa**

Run: `cd web && npx vitest run src/components/ui/charts.test.tsx`
Expected: PASS (3 testes).

- [ ] **Step 5: Trocar o card no dashboard**

Em `web/src/pages/academia/AcademyDashboardPage.tsx`, no card "Alunos por dia da semana" (hoje usa `MultiLineChart`), trocar por `WeekdayLineChart`:

```tsx
<WeekdayLineChart
  xLabels={mockWeekdayBySex.xLabels}
  fullLabels={['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']}
  series={[
    { label: 'Masculino', color: 'var(--color-data-1)', values: mockWeekdayBySex.masc },
    { label: 'Feminino', color: 'var(--color-data-4)', values: mockWeekdayBySex.fem },
  ]}
/>
```

Atualizar o import de `charts` para incluir `WeekdayLineChart` (e remover `MultiLineChart` do import **se** não for mais usado no arquivo — verificar; ele só é usado nesse card). Manter `ChartLegend` (a legenda Masc./Fem. do header do card continua).

- [ ] **Step 6: Typecheck + testes**

Run: `cd web && node node_modules/typescript/bin/tsc --noEmit && npx vitest run`
Expected: sem erros de tipo; todos os testes passam.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/ui/charts.tsx web/src/components/ui/charts.test.tsx web/src/pages/academia/AcademyDashboardPage.tsx
git commit -m "feat(web): gráfico de dias da semana com tooltip no hover (TEC-79)"
```

---

## Task 2: Filtro de unidade + período no header + escopo dos cards de prévia

**Files:**
- Create: `web/src/components/academy/UnitFilter.tsx`
- Create: `web/src/components/academy/PeriodSegmented.tsx`
- Create: `web/src/components/academy/UnitFilter.test.tsx`
- Modify: `web/src/mocks/academyInsights.ts` (helper `scopeFactor` + versões escaladas)
- Modify: `web/src/pages/academia/AcademyDashboardPage.tsx` (header com filtros, estado `scope`/`period`, cards de prévia por escopo, título/tag por unidade)
- Modify: `web/src/hooks/useAcademy.ts` **apenas se necessário** para expor a lista de unidades (senão usar `useNetworkDashboard` de `useAcademyNetwork.ts`)

- [ ] **Step 1: Escrever o teste do `UnitFilter` (falha esperada)**

```tsx
// web/src/components/academy/UnitFilter.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnitFilter } from './UnitFilter';

const units = [
  { id: 'u1', name: 'Unidade Centro' },
  { id: 'u2', name: 'Unidade Zona Sul' },
];

describe('UnitFilter', () => {
  it('lista "Todas as unidades" + as unidades ao abrir', () => {
    render(<UnitFilter units={units} value={null} onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /todas as unidades/i }));
    expect(screen.getByText('Unidade Centro')).toBeInTheDocument();
    expect(screen.getByText('Unidade Zona Sul')).toBeInTheDocument();
  });

  it('dispara onChange com o id ao selecionar uma unidade', () => {
    const onChange = vi.fn();
    render(<UnitFilter units={units} value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /todas as unidades/i }));
    fireEvent.click(screen.getByText('Unidade Zona Sul'));
    expect(onChange).toHaveBeenCalledWith('u2');
  });

  it('dispara onChange com null ao escolher "Todas"', () => {
    const onChange = vi.fn();
    render(<UnitFilter units={units} value="u1" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText(/todas as unidades/i));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 2: Rodar, confirmar falha**

Run: `cd web && npx vitest run src/components/academy/UnitFilter.test.tsx`
Expected: FAIL — componente não existe.

- [ ] **Step 3: Implementar `UnitFilter.tsx`**

```tsx
// web/src/components/academy/UnitFilter.tsx
import { useEffect, useRef, useState } from 'react';

export type UnitOption = { id: string; name: string; type?: string | null };

// [ACTUS — TEC-79] Filtro de unidade (academia/filial/franquia) do dashboard do gestor.
// value=null => visão consolidada ("Todas as unidades").
export function UnitFilter({
  units,
  value,
  onChange,
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
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
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
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="inline-flex h-[30px] items-center gap-2 rounded-full border border-outline-v bg-surface-1 px-3 text-[13px] text-text-1 transition-colors hover:border-outline"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon" aria-hidden>
          <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
        </svg>
        <span>{label}</span>
        <span className="text-[9px] text-text-3">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 flex min-w-[248px] flex-col gap-0.5 rounded-xl border border-outline-v bg-surface-2 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.42)]">
          <button
            type="button"
            onClick={() => choose(null)}
            className={`flex flex-col items-start gap-px rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-3 ${value == null ? 'bg-[rgba(203,254,0,0.10)] text-neon' : 'text-text-1'}`}
          >
            Todas as unidades
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">Visão consolidada</span>
          </button>
          {units.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => choose(u.id)}
              className={`flex flex-col items-start gap-px rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-3 ${value === u.id ? 'bg-[rgba(203,254,0,0.10)] text-neon' : 'text-text-1'}`}
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
```

- [ ] **Step 4: Rodar o teste do UnitFilter, confirmar que passa**

Run: `cd web && npx vitest run src/components/academy/UnitFilter.test.tsx`
Expected: PASS.

- [ ] **Step 5: Implementar `PeriodSegmented.tsx`**

```tsx
// web/src/components/academy/PeriodSegmented.tsx
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
```

- [ ] **Step 6: Helper de escopo nos mocks**

Em `web/src/mocks/academyInsights.ts`, adicionar no fim:

```ts
// [TEC-79] Escala determinística dos mocks por unidade selecionada, para o filtro de unidade
// mudar visivelmente os cards de "Prévia" sem backend por unidade. scope=null => consolidado (1.0).
export function scopeFactor(scope: string | null): number {
  if (!scope) return 1;
  let h = 0;
  for (let i = 0; i < scope.length; i++) h = (h * 31 + scope.charCodeAt(i)) >>> 0;
  return 0.55 + (h % 41) / 100; // 0.55 .. 0.95, estável por id
}

export function scaleColumns<T extends { value: number }>(rows: T[], f: number): T[] {
  return rows.map((r) => ({ ...r, value: Math.round(r.value * f) }));
}
```

- [ ] **Step 7: Wire no `AcademyDashboardPage.tsx`**

Mudanças no `web/src/pages/academia/AcademyDashboardPage.tsx`:

1. Imports: `import { useState } from 'react';`, `UnitFilter` (+ tipo `UnitOption`), `PeriodSegmented` (+ tipo `Period`), `useNetworkDashboard` de `../../hooks/useAcademyNetwork`, `scopeFactor`, `scaleColumns` dos mocks.
2. Estado: `const [scope, setScope] = useState<string | null>(null);` e `const [period, setPeriod] = useState<Period>('month');`.
3. Unidades: `const isHq = academy?.network_role === 'network_hq';` e `const net = useNetworkDashboard({ enabled: isHq });` (ver nota abaixo) → `const units = (net.data?.units ?? []).map((u) => ({ id: u.id, name: u.name }));`.
   - **Nota:** `useNetworkDashboard` hoje não recebe `enabled`. Ajustar a assinatura para aceitar `{ enabled?: boolean }` e repassar ao `useQuery` (para não chamar `/academy/network/dashboard` quando não for HQ, evitando 403). Manter compatível com a chamada existente em `NetworkDashboardPage` (sem args → enabled default true).
4. Header (linha ~92): substituir o header atual por:
   ```tsx
   <div className="flex h-[52px] items-center justify-between gap-3 border-b border-outline-v px-6">
     <div className="flex min-w-0 items-center gap-2.5">
       <h1 className="truncate font-display text-xl font-black uppercase tracking-wide text-text-1">
         {scope ? (units.find((u) => u.id === scope)?.name ?? academy?.name ?? 'Academia') : (academy?.name ?? 'Academia')}
       </h1>
       {scope && <span className="shrink-0 rounded bg-accent-muted-surface px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent-muted">Filial</span>}
     </div>
     <div className="flex flex-wrap items-center justify-end gap-2.5">
       {isHq && units.length > 0 && <UnitFilter units={units} value={scope} onChange={setScope} />}
       <PeriodSegmented value={period} onChange={setPeriod} />
     </div>
   </div>
   ```
   - **Nota token:** confirmar que `accent-muted-surface` existe como cor no `@theme`; se não existir como classe utilitária, usar `style={{ background: 'var(--color-accent-muted-surface)' }}` ou a var equivalente. Verificar em `web/src/index.css`.
5. Cards de prévia por escopo: derivar `const f = scopeFactor(scope);` e aplicar `scaleColumns(mockAgeBuckets, f)` e `scaleColumns(mockWeeklyFrequencyTotals, f)` nos `ColumnChart`; para o `WeekdayLineChart`, escalar os arrays (`mockWeekdayBySex.masc.map(v => Math.round(v*f))` etc.); para `mockModalities`/`mockGoals`, escalar `value`. Cards de pessoas (inadimplentes/aniversariantes) e ocupação podem permanecer (ou escalar ocupação `current`). O objetivo é que **selecionar uma unidade mude visivelmente os cards de prévia**. Não alterar os cards de dado real (KPIs/ranking) além do que o backend permite.
6. KPIs reais por unidade: quando `scope != null` e houver `net.data`, exibir `total_students`/`instructors` daquela unidade (`net.data.units.find(...)`) nos KPIs correspondentes; os demais KPIs reais podem exibir "—" com a tela já sinalizando prévia. (Manter simples; não inventar valores reais.)

- [ ] **Step 8: Teste de integração da página**

Adicionar/estender teste do dashboard (`web/src/pages/academia/AcademyDashboardPage.test.tsx`, criar se não existir) cobrindo:
- Mock de `useAcademyDashboard`, `useNetworkDashboard`, `useAuthStore` (academy com `network_role: 'network_hq'`) → o filtro de unidade aparece.
- Com `network_role: 'unit'`/ausente → o filtro de unidade **não** aparece.
- Selecionar uma unidade muda o título do header para o nome da unidade e mostra a tag "Filial".

(Seguir o padrão de mock de `NetworkDashboardPage.test.tsx`. Mockar os hooks via `vi.mock` dos módulos de hooks; mockar `useAuthStore` retornando o academy conforme o seletor.)

Run: `cd web && npx vitest run src/pages/academia`
Expected: PASS.

- [ ] **Step 9: Typecheck + suíte completa**

Run: `cd web && node node_modules/typescript/bin/tsc --noEmit && npx vitest run`
Expected: limpo; todos os testes passam.

- [ ] **Step 10: Commit**

```bash
git add web/src/components/academy/ web/src/mocks/academyInsights.ts web/src/pages/academia/AcademyDashboardPage.tsx web/src/hooks/useAcademyNetwork.ts
git commit -m "feat(web): filtro de unidade + período no dashboard da academia (TEC-79)"
```

---

## Self-Review

- **Cobertura da issue:** filtro de unidade (Task 2), remover Comissões (feito inline), ajustar layout (header reestruturado na Task 2 + fim da distorção do gráfico na Task 1), hover no gráfico (Task 1). ✓
- **Limitação registrada:** dashboard real por unidade depende de endpoint de backend — chip de follow-up para o Julio (fora deste plano).
- **Consistência de tipos:** `scope: string | null`, `Period`, `UnitOption { id, name, type? }` usados de forma consistente entre `UnitFilter`, `PeriodSegmented`, mocks e a página.
- **Sem regressão:** `MultiLineChart` continua exportado para outros usos; só o card de dias da semana passa a `WeekdayLineChart`.
