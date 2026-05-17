export default function BarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 600;
  const H = 200;
  const padL = 28;
  const padB = 22;
  const padT = 8;
  const chartW = W - padL - 8;
  const chartH = H - padT - padB;
  const barW = chartW / data.length;
  const gap = barW * 0.35;

  const yTicks = 4;
  const tickStep = max / yTicks;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full">
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const v = tickStep * (yTicks - i);
        const y = padT + (chartH / yTicks) * i;
        return (
          <g key={i}>
            <line
              x1={padL}
              x2={W - 8}
              y1={y}
              y2={y}
              stroke="oklch(92% 0.0015 155)"
              strokeWidth={1}
            />
            <text
              x={padL - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-neutral-400"
              style={{ fontSize: 9 }}
            >
              {Math.round(v)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = (d.value / max) * chartH;
        const x = padL + i * barW + gap / 2;
        const y = padT + chartH - h;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW - gap}
              height={h}
              rx={3}
              className="fill-neutral-900"
            />
            <text
              x={x + (barW - gap) / 2}
              y={H - 6}
              textAnchor="middle"
              className="fill-neutral-400"
              style={{ fontSize: 9 }}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
