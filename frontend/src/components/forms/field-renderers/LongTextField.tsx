"use client";

import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id?: string;
}

export function LongTextField({ item, value, onChange, disabled, id }: Props) {
  const stringValue = typeof value === "string" ? value : value != null ? String(value) : "";
  const maxLength = item.validation?.max_length || 2000;

  return (
    <div>
      <textarea
        id={id}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="input-field min-h-[120px] resize-y"
        placeholder={item.help_text || `Enter ${item.label.toLowerCase()}`}
        maxLength={maxLength}
        minLength={item.validation?.min_length}
        rows={5}
      />
      <div className="mt-1 flex justify-end">
        <span
          className={`text-xs ${
            stringValue.length > maxLength * 0.9
              ? "text-amber-600"
              : "text-slate-400"
          }`}
        >
          {stringValue.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}
