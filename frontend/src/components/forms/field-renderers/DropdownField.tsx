"use client";

import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id?: string;
}

export function DropdownField({ item, value, onChange, disabled, id }: Props) {
  const stringValue = typeof value === "string" ? value : value != null ? String(value) : "";

  return (
    <select
      id={id}
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
