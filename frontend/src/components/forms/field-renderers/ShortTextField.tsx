"use client";

import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function ShortTextField({ item, value, onChange, disabled }: Props) {
  const stringValue = (value as string) || "";

  return (
    <input
      type="text"
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="input-field"
      placeholder={item.help_text || `Enter ${item.label.toLowerCase()}`}
      maxLength={item.validation?.max_length}
      minLength={item.validation?.min_length}
      required={item.validation?.required}
    />
  );
}
