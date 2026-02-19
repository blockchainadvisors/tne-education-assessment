"use client";

import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

interface YesNoValue {
  answer: boolean | null;
  details?: string;
}

export function YesNoConditionalField({
  item,
  value,
  onChange,
  disabled,
}: Props) {
  const currentValue: YesNoValue =
    typeof value === "object" && value !== null
      ? (value as YesNoValue)
      : { answer: null, details: "" };

  function handleToggle(answer: boolean) {
    onChange({
      ...currentValue,
      answer,
      details: answer ? currentValue.details : "",
    });
  }

  function handleDetailsChange(details: string) {
    onChange({ ...currentValue, details });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleToggle(true)}
          disabled={disabled}
          className={`rounded-lg px-6 py-2 text-sm font-medium transition-colors ${
            currentValue.answer === true
              ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => handleToggle(false)}
          disabled={disabled}
          className={`rounded-lg px-6 py-2 text-sm font-medium transition-colors ${
            currentValue.answer === false
              ? "bg-red-100 text-red-700 ring-1 ring-red-300"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          No
        </button>
      </div>

      {currentValue.answer === true && (
        <div className="ml-0 border-l-2 border-indigo-200 pl-4">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Please provide details
          </label>
          <textarea
            value={currentValue.details || ""}
            onChange={(e) => handleDetailsChange(e.target.value)}
            disabled={disabled}
            className="input-field min-h-[80px] resize-y"
            placeholder="Provide additional details..."
            rows={3}
          />
        </div>
      )}
    </div>
  );
}
