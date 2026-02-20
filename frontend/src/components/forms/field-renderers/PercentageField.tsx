"use client";

import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id?: string;
}

export function PercentageField({ item, value, onChange, disabled, id }: Props) {
  const parsed = value !== undefined && value !== null && value !== "" ? Number(value) : NaN;
  const numValue = Number.isNaN(parsed) ? "" : parsed;

  return (
    <div className="relative max-w-xs">
      <input
        id={id}
        type="number"
        value={numValue}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") {
            onChange(null);
            return;
          }
          const num = Number(val);
          // Clamp between 0-100
          if (num < 0) onChange(0);
          else if (num > 100) onChange(100);
          else onChange(num);
        }}
        disabled={disabled}
        className="input-field pr-10"
        placeholder="0"
        min={item.validation?.min_value ?? 0}
        max={item.validation?.max_value ?? 100}
        step="0.01"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
        %
      </span>
    </div>
  );
}
