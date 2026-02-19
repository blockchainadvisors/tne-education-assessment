"use client";

import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function MultiSelectField({ item, value, onChange, disabled }: Props) {
  const selectedValues: string[] = Array.isArray(value) ? value : [];

  function handleToggle(optionValue: string) {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  }

  return (
    <div className="space-y-2">
      {item.options?.map((opt) => (
        <label
          key={opt.value}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
            selectedValues.includes(opt.value)
              ? "border-indigo-300 bg-indigo-50"
              : "border-slate-200 hover:bg-slate-50"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <input
            type="checkbox"
            checked={selectedValues.includes(opt.value)}
            onChange={() => handleToggle(opt.value)}
            disabled={disabled}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          <span className="text-sm text-slate-700">{opt.label}</span>
        </label>
      ))}
      {(!item.options || item.options.length === 0) && (
        <p className="text-sm italic text-slate-400">No options available.</p>
      )}
    </div>
  );
}
