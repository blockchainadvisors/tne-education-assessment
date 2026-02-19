"use client";

import { useMemo } from "react";
import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id?: string;
}

interface SalaryBand {
  band: string;
  min: number | null;
  max: number | null;
  median: number | null;
}

const DEFAULT_BANDS = [
  "Professor",
  "Associate Professor",
  "Senior Lecturer",
  "Lecturer",
  "Teaching Assistant",
];

export function SalaryBandsField({ item, value, onChange, disabled, id }: Props) {
  const bands = item.options?.map((o) => o.value) || DEFAULT_BANDS;

  const salaryData: SalaryBand[] = useMemo(() => {
    if (Array.isArray(value)) {
      return value as SalaryBand[];
    }
    return bands.map((band) => ({
      band,
      min: null,
      max: null,
      median: null,
    }));
  }, [value, bands]);

  function handleChange(
    bandIndex: number,
    field: "min" | "max" | "median",
    val: string
  ) {
    const updated = [...salaryData];
    updated[bandIndex] = {
      ...updated[bandIndex],
      [field]: val === "" ? null : Number(val),
    };
    onChange(updated);
  }

  return (
    <div id={id} className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Band / Role
            </th>
            <th className="px-3 py-2 text-center font-medium text-slate-600">
              Min Salary
            </th>
            <th className="px-3 py-2 text-center font-medium text-slate-600">
              Max Salary
            </th>
            <th className="px-3 py-2 text-center font-medium text-slate-600">
              Median Salary
            </th>
          </tr>
        </thead>
        <tbody>
          {salaryData.map((row, idx) => (
            <tr key={row.band} className="border-b border-slate-100">
              <td className="px-3 py-2 font-medium text-slate-700">
                {row.band}
              </td>
              <td className="px-1 py-1 text-center">
                <input
                  type="number"
                  min={0}
                  value={row.min ?? ""}
                  onChange={(e) => handleChange(idx, "min", e.target.value)}
                  disabled={disabled}
                  className="input-field-compact w-28"
                  placeholder="0"
                />
              </td>
              <td className="px-1 py-1 text-center">
                <input
                  type="number"
                  min={0}
                  value={row.max ?? ""}
                  onChange={(e) => handleChange(idx, "max", e.target.value)}
                  disabled={disabled}
                  className="input-field-compact w-28"
                  placeholder="0"
                />
              </td>
              <td className="px-1 py-1 text-center">
                <input
                  type="number"
                  min={0}
                  value={row.median ?? ""}
                  onChange={(e) => handleChange(idx, "median", e.target.value)}
                  disabled={disabled}
                  className="input-field-compact w-28"
                  placeholder="0"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
