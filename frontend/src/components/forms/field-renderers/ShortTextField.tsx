"use client";

import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id?: string;
}

export function ShortTextField({ item, value, onChange, disabled, id }: Props) {
  const stringValue = (value as string) || "";

  return (
    <input
      id={id}
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
