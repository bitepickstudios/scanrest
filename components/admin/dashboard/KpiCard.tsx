import { Card } from "@heroui/react";
import { ArrowDown, ArrowUp } from "lucide-react";

export default function KpiCard({
  label,
  value,
  deltaPct,
}: {
  label: string;
  value: string;
  deltaPct: number | null;
}) {
  const hasDelta = deltaPct !== null && isFinite(deltaPct);
  const positive = hasDelta && deltaPct >= 0;
  return (
    <Card variant="default">
      <Card.Content className="py-5">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <p className="text-2xl font-bold tabular-nums text-neutral-900">{value}</p>
          {hasDelta && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                positive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {positive ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              {Math.abs(deltaPct).toFixed(1)}%
            </span>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
