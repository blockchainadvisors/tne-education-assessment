"use client";

import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id?: string;
}

export function NumericField({ item, value, onChange, disabled, id }: Props) {
  const parsed = value !== undefined && value !== null && value !== "" ? Number(value) : NaN;
  const numValue = Number.isNaN(parsed) ? "" : parsed;

  return (
    <input
      id={id}
      type="number"
      value={numValue}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val === "" ? null : Number(val));
      }}
      disabled={disabled}
      className="input-field max-w-xs"
      placeholder="0"
      min={item.validation?.min_value}
      max={item.validation?.max_value}
      step="any"
    />
  );
}
