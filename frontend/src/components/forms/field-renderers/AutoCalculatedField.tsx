"use client";

import { Calculator } from "lucide-react";
import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function AutoCalculatedField({ item, value }: Props) {
  const displayValue =
    value !== undefined && value !== null && value !== ""
      ? String(value)
      : "--";

  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
      <Calculator className="h-5 w-5 shrink-0 text-indigo-500" />
      <div>
        <span className="text-lg font-semibold text-slate-900">
          {displayValue}
        </span>
        {item.calculation_formula && (
          <p className="text-xs text-slate-500">
            Formula: {item.calculation_formula}
          </p>
        )}
      </div>
    </div>
  );
}
