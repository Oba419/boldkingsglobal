"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityInput({ value, max, onChange, label, min = 1 }: { value: number; max: number; onChange: (n: number) => void; label: string; min?: number }) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="inline-flex h-11 items-center overflow-hidden rounded-xl border border-line bg-card shadow-card" role="group" aria-label={label}>
      <button type="button" className="flex h-full w-11 items-center justify-center transition-colors hover:bg-surface hover:text-gold-700 active:scale-90 disabled:pointer-events-none disabled:opacity-30 dark:hover:text-gold-400" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(clamp(value - 1))}>
        <Minus className="size-4" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className="h-full w-12 border-x border-line bg-transparent text-center text-sm font-semibold tabular-nums [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        min={min}
        max={max}
        aria-label="Quantity"
        onChange={(e) => {
          const n = Number.parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(clamp(n));
        }}
      />
      <button type="button" className="flex h-full w-11 items-center justify-center transition-colors hover:bg-surface hover:text-gold-700 active:scale-90 disabled:pointer-events-none disabled:opacity-30 dark:hover:text-gold-400" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(clamp(value + 1))}>
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
