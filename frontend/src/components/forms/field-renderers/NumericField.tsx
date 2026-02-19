"use client";

import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function NumericField({ item, value, onChange, disabled }: Props) {
  const numValue = value !== undefined && value !== null && value !== "" ? Number(value) : "";

  return (
    <input
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
