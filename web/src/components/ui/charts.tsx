// [ACTUS — academia] Gráficos leves sem dependência externa. Cor accent-muted (azul-névoa);
// o neon fica reservado para um único destaque por tela (design system).

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
