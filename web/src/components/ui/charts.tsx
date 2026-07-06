// [ACTUS — academia] Gráficos leves sem dependência externa. Cor accent-muted (azul-névoa);
// o neon fica reservado para um único destaque por tela (design system).

import { useState } from 'react';

export type ChartPoint = { label?: string; value: number };

/** Mini gráfico de barras responsivo (frequência/atividade por período). */
export function BarMini({
  data,
  height = 56,
  className = '',
}: {
  data: ChartPoint[];
  height?: number;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={`flex items-end gap-[3px] ${className}`} style={{ height }}>
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-accent-muted/70 transition-[height]"
          style={{ height: `${Math.max(d.value > 0 ? 3 : 0, (d.value / max) * 100)}%` }}
          title={d.label ? `${d.label}: ${d.value}` : String(d.value)}
        />
      ))}
    </div>
  );
}

/** Linha de tendência (ex: aderência semanal). preserveAspectRatio none → estica na largura. */
export function TrendLine({
  data,
  height = 64,
  className = '',
}: {
  data: ChartPoint[];
  height?: number;
  className?: string;
}) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const range = max - min || 1;
  const width = 100;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const coords = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d.value - min) / range) * height;
    return { x, y };
  });
  const polyline = coords.map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
      role="img"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--color-accent-muted)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={1.4} fill="var(--color-accent-muted)" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// [ACTUS — academia] Widgets de dataviz do dashboard gerencial. Cor vem dos
// DADOS (paleta --color-data-1..6), não do fundo — o neon segue reservado
// como única cor de ação em toda a tela.

export type ColumnDatum = { label: string; value: number; color?: string };

/** Gráfico de colunas com rótulo de valor sobre a barra. */
export function ColumnChart({
  data,
  height = 168,
  color = 'var(--color-data-1)',
  className = '',
}: {
  data: ColumnDatum[];
  height?: number;
  color?: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={`flex items-end gap-3 pt-2 ${className}`} style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div className="flex w-full flex-1 items-end justify-center">
            <div
              className="relative w-full max-w-[44px] rounded-t-md opacity-90 transition-opacity hover:opacity-100"
              style={{ height: `${Math.max(d.value > 0 ? 3 : 0, (d.value / max) * 100)}%`, background: d.color ?? color }}
            >
              <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] text-text-2">
                {d.value}
              </span>
            </div>
          </div>
          <span className="text-center font-mono text-[10px] leading-tight text-text-3">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export type LineSeries = { label: string; color: string; values: number[] };

/** Linha multi-série (ex: distribuição por sexo) com legenda de cores. */
export function MultiLineChart({
  series,
  xLabels,
  height = 150,
  className = '',
}: {
  series: LineSeries[];
  xLabels: string[];
  height?: number;
  className?: string;
}) {
  const width = 320;
  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(1, ...allValues);
  const min = Math.min(0, ...allValues);
  const range = max - min || 1;
  const stepX = xLabels.length > 1 ? width / (xLabels.length - 1) : 0;
  const toY = (v: number) => height - 1 - ((v - min) / range) * (height - 16);

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Gráfico de linhas">
        <line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke="var(--color-outline-v)" strokeWidth={1} />
        <line x1={0} y1={height * 0.5} x2={width} y2={height * 0.5} stroke="var(--color-outline-v)" strokeWidth={0.5} opacity={0.5} />
        {series.map((s) => {
          const coords = s.values.map((v, i) => ({ x: i * stepX, y: toY(v) }));
          const points = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
          return (
            <g key={s.label}>
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {coords.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r={2.6} fill={s.color} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="mt-1.5 flex justify-between">
        {xLabels.map((l) => (
          <span key={l} className="flex-1 text-center font-mono text-[10px] text-text-3">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Legenda inline de cores para gráficos de linha/área multi-série. */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-text-3">
          <i className="h-[9px] w-[9px] rounded-full" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export type DonutSegment = { label: string; value: number; color: string };

/** Donut via conic-gradient (CSS puro) + legenda com valor/percentual. */
export function Donut({
  segments,
  centerValue,
  centerLabel,
  size = 148,
}: {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
  size?: number;
}) {
  const total = Math.max(1, segments.reduce((sum, s) => sum + s.value, 0));
  const cumulative = segments.reduce<number[]>((acc, s) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
    return [...acc, prev + s.value];
  }, []);
  const stops = segments
    .map((s, i) => {
      const from = (cumulative[i - 1] ?? 0) / total * 360;
      const to = cumulative[i] / total * 360;
      return `${s.color} ${from.toFixed(2)}deg ${to.toFixed(2)}deg`;
    })
    .join(', ');

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative shrink-0 rounded-full"
        style={{ width: size, height: size, background: `conic-gradient(${stops})` }}
      >
        <div className="absolute rounded-full bg-surface-1" style={{ inset: size * 0.175 }} />
        <div className="absolute inset-0 z-10 grid place-items-center text-center">
          <div>
            <div className="font-mono text-2xl leading-none text-text-1">{centerValue}</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-text-3">{centerLabel}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm text-text-2">
            <span className="h-[9px] w-[9px] shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="flex-1">{s.label}</span>
            <span className="font-mono text-text-1">{s.value}</span>
            <span className="w-10 text-right font-mono text-[11px] text-text-3">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Área com gradiente (hero chart) + marcador opcional de pico com tooltip. */
export function AreaChart({
  values,
  xLabels,
  height = 200,
  color = 'var(--color-data-1)',
  peakIndex,
  peakColor = 'var(--color-data-3)',
  className = '',
}: {
  values: number[];
  xLabels: string[];
  height?: number;
  color?: string;
  peakIndex?: number;
  peakColor?: string;
  className?: string;
}) {
  const width = 640;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const pad = 12;
  const toY = (v: number) => pad + (height - pad * 2) * (1 - (v - min) / range);
  const coords = values.map((v, i) => ({ x: i * stepX, y: toY(v) }));
  const linePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;
  const gradId = 'areaFillGrad';
  const peak = peakIndex != null ? coords[peakIndex] : undefined;

  return (
    <div className={`relative ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Gráfico de área">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <line x1={0} y1={height - 20} x2={width} y2={height - 20} stroke="var(--color-outline-v)" strokeWidth={1} />
        <polygon points={areaPoints} fill={`url(#${gradId})`} />
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {peak && (
          <>
            <line x1={peak.x} y1={peak.y} x2={peak.x} y2={height - 20} stroke={peakColor} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
            <circle cx={peak.x} cy={peak.y} r={4.5} fill={peakColor} stroke="var(--color-bg-base)" strokeWidth={2} />
          </>
        )}
      </svg>
      <div className="mt-1.5 flex justify-between">
        {xLabels.map((l) => (
          <span key={l} className="flex-1 text-center font-mono text-[10px] text-text-3">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

export type ProgressDatum = { label: string; pct: number; color: string };

/** Lista de barras de progresso coloridas (ex: aderência por objetivo). */
export function ProgressList({ items }: { items: ProgressDatum[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[13px] text-text-2">{it.label}</span>
            <span className="font-mono text-xs text-text-1">{it.pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full" style={{ width: `${it.pct}%`, background: it.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Matriz de ocupação (dot-matrix). Embaralhamento determinístico (sem Math.random)
 * para o padrão de pontos acesos não mudar a cada re-render.
 */
export function DotMatrix({
  total,
  lit,
  cols = 14,
  hotEvery = 7,
}: {
  total: number;
  lit: number;
  cols?: number;
  hotEvery?: number;
}) {
  const pattern = Array.from({ length: total }, (_, i) => (i < lit ? (i % hotEvery === 0 ? 'hot' : 'on') : 'off'));
  for (let j = pattern.length - 1; j > 0; j--) {
    const k = (j * 7 + 13) % (j + 1);
    const tmp = pattern[j];
    pattern[j] = pattern[k];
    pattern[k] = tmp;
  }
  const colorFor = (state: string) =>
    state === 'hot' ? 'var(--color-data-4)' : state === 'on' ? 'var(--color-data-1)' : 'var(--color-surface-3)';

  return (
    <div className="grid gap-[7px] py-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {pattern.map((state, i) => (
        <i key={i} className="aspect-square w-full rounded-full" style={{ background: colorFor(state) }} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// [ACTUS — academia] Gráfico de linhas por dia da semana, com guia vertical,
// pontos destacados e tooltip no hover (mesmo comportamento do protótipo
// #weekChart / classes .lc-*). Cor vem dos DADOS (paleta --color-data-*).

export type WeekdaySeries = { label: string; color: string; values: number[] };

/** Linha multi-série por dia da semana com hover interativo (guia + pontos + tooltip). */
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
  const padT = 12;
  const padB = 88;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  // NB: viewBox é 0 0 100 100, então y(v) em unidades do viewBox coincide com % do container
  // (usado tanto para os pontos/ SVG quanto para o `top` do tooltip). Manter padT/padB nessa escala 0–100.
  const y = (v: number) => padT + (1 - v / max) * (padB - padT);

  const activeMinY =
    active === null ? 0 : Math.min(...series.map((s) => y(s.values[active] ?? 0)));
  const activeTotal =
    active === null ? 0 : series.reduce((sum, s) => sum + (s.values[active] ?? 0), 0);

  return (
    <div className={className}>
      <div
        data-plot
        className="relative"
        style={{ height }}
        onMouseLeave={() => setActive(null)}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          {[
            { yPos: padB, opacity: 1 },
            { yPos: 50, opacity: 0.5 },
            { yPos: padT, opacity: 0.5 },
          ].map((g) => (
            <line
              key={g.yPos}
              x1={0}
              y1={g.yPos}
              x2={100}
              y2={g.yPos}
              stroke="var(--color-outline-v)"
              strokeWidth={1}
              opacity={g.opacity}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {series.map((s) => (
            <polyline
              key={s.label}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
          ))}
        </svg>

        {active !== null && (
          <div
            className="absolute top-1 bottom-1 w-px -translate-x-1/2 bg-outline-v/55"
            style={{ left: `${x(active)}%` }}
          />
        )}

        {series.flatMap((s) =>
          s.values.map((v, i) => (
            <i
              key={`${s.label}-${i}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_3px_var(--color-surface-1)] transition-[width,height] ${
                active === i ? 'h-3 w-3' : 'h-2 w-2'
              }`}
              style={{ left: `${x(i)}%`, top: `${y(v)}%`, background: s.color }}
            />
          )),
        )}

        {active !== null && (
          <div
            className="absolute z-10 min-w-[158px] -translate-x-1/2 -translate-y-full rounded-[10px] border border-outline-v bg-surface-3 px-[11px] py-[9px] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            style={{
              left: `${Math.max(12, Math.min(88, x(active)))}%`,
              top: `${activeMinY}%`,
              transform: 'translate(-50%, calc(-100% - 12px))',
            }}
          >
            <div className="mb-1.5 font-mono text-[11px] text-text-2">{fullLabels[active]}</div>
            {series.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between gap-4 text-xs [&+&]:mt-[3px]"
              >
                <span className="inline-flex items-center gap-1.5 text-text-3">
                  <i className="h-[7px] w-[7px] rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="font-mono text-text-1">{s.values[active] ?? 0}</span>
              </div>
            ))}
            <div className="mt-[7px] flex items-center justify-between gap-4 border-t border-outline-v pt-1.5 text-xs">
              <span className="text-text-3">Total</span>
              <span className="font-mono text-text-1">{activeTotal}</span>
            </div>
          </div>
        )}

        {xLabels.map((_, i) => (
          <div
            key={i}
            data-hover-col
            className="absolute top-0 bottom-0 -translate-x-1/2 cursor-pointer"
            style={{ left: `${x(i)}%`, width: `${100 / n}%` }}
            onMouseEnter={() => setActive(i)}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between">
        {xLabels.map((l, i) => (
          <span
            key={l}
            className={`flex-1 text-center font-mono text-[10px] transition-colors ${
              active === i ? 'text-text-1' : 'text-text-3'
            }`}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
