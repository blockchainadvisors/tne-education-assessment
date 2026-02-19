"use client";

import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function DropdownField({ item, value, onChange, disabled }: Props) {
  const stringValue = (value as string) || "";

  return (
    <select
      value={stringValue}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      className="input-field max-w-md"
    >
      <option value="">Select an option...</option>
      {item.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
