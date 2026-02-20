"use client";

import { Calculator } from "lucide-react";
import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id?: string;
}

export function AutoCalculatedField({ item, value, id }: Props) {
  const displayValue =
    value !== undefined && value !== null && value !== ""
      ? typeof value === "object" ? JSON.stringify(value) : String(value)
      : "--";

  return (
    <div id={id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
      <Calculator className="h-5 w-5 shrink-0 text-brand-500" />
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
