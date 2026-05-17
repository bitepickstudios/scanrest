export default function LineChart({
  data,
  series,
}: {
  data: { label: string }[];
  series: { key: string; color: string; values: number[] }[];
}) {
  const W = 600;
  const H = 220;
  const padL = 32;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.values)
  );

  const yTicks = 4;
  const tickStep = max / yTicks;

  const xFor = (i: number) =>
    padL + (chartW / Math.max(1, data.length - 1)) * i;
  const yFor = (v: number) => padT + chartH - (v / max) * chartH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-52 w-full">
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const v = tickStep * (yTicks - i);
        const y = padT + (chartH / yTicks) * i;
        return (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
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
              {formatTick(v)}
            </text>
          </g>
        );
      })}
      {series.map((s) => {
        const d = s.values
          .map((v, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(v)}`)
          .join(" ");
        return (
          <g key={s.key}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2} />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={xFor(i)}
                cy={yFor(v)}
                r={2.5}
                fill={s.color}
              />
            ))}
          </g>
        );
      })}
      {data.map((d, i) => (
        <text
          key={i}
          x={xFor(i)}
          y={H - 6}
          textAnchor="middle"
          className="fill-neutral-400"
          style={{ fontSize: 9 }}
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
}

function formatTick(v: number): string {
  if (v >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(Math.round(v));
}
