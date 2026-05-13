"use client";

import { Minus, Plus } from "lucide-react";

export default function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  size = "md",
  onClickCapture,
}: {
  value: number;
  onIncrement: (e: React.MouseEvent) => void;
  onDecrement: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
  onClickCapture?: (e: React.MouseEvent) => void;
}) {
  const btn =
    size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const icon = size === "sm" ? 14 : 16;
  const text = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div
      onClick={onClickCapture}
      className="inline-flex items-center gap-1 rounded-full bg-white p-1 shadow-md ring-1 ring-neutral-200"
    >
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Quitar uno"
        className={`${btn} flex items-center justify-center rounded-full bg-neutral-100 text-neutral-700 active:scale-95`}
      >
        <Minus size={icon} strokeWidth={2.5} />
      </button>
      <span className={`${text} min-w-5 text-center font-bold tabular-nums`}>
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Agregar uno"
        className={`${btn} flex items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] active:scale-95`}
      >
        <Plus size={icon} strokeWidth={2.5} />
      </button>
    </div>
  );
}
