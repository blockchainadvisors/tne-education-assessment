"use client";

import { useMemo } from "react";
import type { Item } from "@/lib/types";
import { calculateGridTotals } from "@/lib/calculations";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

type GridData = Record<string, Record<string, number>>;

const DEFAULT_YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
const DEFAULT_GENDERS = ["male", "female"];

export function MultiYearGenderField({
  item,
  value,
  onChange,
  disabled,
}: Props) {
  const years =
    item.options?.map((o) => o.value) || DEFAULT_YEARS;
  const genders = DEFAULT_GENDERS;

  const gridData: GridData = useMemo(() => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return value as GridData;
    }
    // Initialize empty grid
    const grid: GridData = {};
    genders.forEach((gender) => {
      grid[gender] = {};
      years.forEach((year) => {
        grid[gender][year] = 0;
      });
    });
    return grid;
  }, [value, years, genders]);

  const { rowTotals, colTotals, grandTotal } = useMemo(
    () => calculateGridTotals(gridData),
    [gridData]
  );

  function handleCellChange(gender: string, year: string, val: string) {
    const newGrid = { ...gridData };
    newGrid[gender] = { ...newGrid[gender], [year]: Number(val) || 0 };
    onChange(newGrid);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Gender
            </th>
            {years.map((year) => (
              <th
                key={year}
                className="px-3 py-2 text-center font-medium text-slate-600"
              >
                {year}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-semibold text-slate-900">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {genders.map((gender) => (
            <tr key={gender} className="border-b border-slate-100">
              <td className="px-3 py-2 font-medium capitalize text-slate-700">
                {gender}
              </td>
              {years.map((year) => (
                <td key={year} className="px-1 py-1 text-center">
                  <input
                    type="number"
                    min={0}
                    value={gridData[gender]?.[year] || 0}
                    onChange={(e) =>
                      handleCellChange(gender, year, e.target.value)
                    }
                    disabled={disabled}
                    className="w-20 rounded border border-slate-200 px-2 py-1 text-center text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </td>
              ))}
              <td className="px-3 py-2 text-center font-semibold text-slate-900">
                {rowTotals[gender] || 0}
              </td>
            </tr>
          ))}
          {/* Totals row */}
          <tr className="border-t-2 border-slate-300 bg-slate-50">
            <td className="px-3 py-2 font-semibold text-slate-900">Total</td>
            {years.map((year) => (
              <td
                key={year}
                className="px-3 py-2 text-center font-semibold text-slate-900"
              >
                {colTotals[year] || 0}
              </td>
            ))}
            <td className="px-3 py-2 text-center font-bold text-indigo-600">
              {grandTotal}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
