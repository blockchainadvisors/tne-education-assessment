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

type PartnerData = Record<string, Record<string, unknown>>;

export function PartnerSpecificField({
  item,
  value,
  onChange,
  disabled,
  id,
}: Props) {
  const partners = item.options || [];
  const subFields = item.sub_fields || [];

  const partnerData: PartnerData = useMemo(() => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return value as PartnerData;
    }
    // Initialize empty data
    const data: PartnerData = {};
    partners.forEach((p) => {
      data[p.value] = {};
      subFields.forEach((sf) => {
        data[p.value][sf.key] = "";
      });
    });
    return data;
  }, [value, partners, subFields]);

  function handleSubFieldChange(
    partnerId: string,
    fieldKey: string,
    fieldValue: unknown
  ) {
    const updated = { ...partnerData };
    updated[partnerId] = { ...updated[partnerId], [fieldKey]: fieldValue };
    onChange(updated);
  }

  if (partners.length === 0) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
        No partner institutions configured. Please add partners in the Admin
        section.
      </div>
    );
  }

  return (
    <div id={id} className="space-y-4">
      {partners.map((partner) => (
        <div
          key={partner.value}
          className="rounded-lg border border-slate-200 p-4"
        >
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            {partner.label}
          </h4>
          <div className="space-y-3">
            {subFields.map((sf) => (
              <div key={sf.key}>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {sf.label}
                </label>
                {sf.field_type === "long_text" ? (
                  <textarea
                    value={
                      (partnerData[partner.value]?.[sf.key] as string) || ""
                    }
                    onChange={(e) =>
                      handleSubFieldChange(
                        partner.value,
                        sf.key,
                        e.target.value
                      )
                    }
                    disabled={disabled}
                    className="input-field min-h-[80px] resize-y"
                    rows={3}
                  />
                ) : sf.field_type === "numeric" ? (
                  <input
                    type="number"
                    value={
                      partnerData[partner.value]?.[sf.key] !== undefined &&
                      partnerData[partner.value]?.[sf.key] !== ""
                        ? Number(partnerData[partner.value][sf.key])
                        : ""
                    }
                    onChange={(e) =>
                      handleSubFieldChange(
                        partner.value,
                        sf.key,
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    disabled={disabled}
                    className="input-field max-w-xs"
                    step="any"
                  />
                ) : sf.field_type === "dropdown" ? (
                  <select
                    value={
                      (partnerData[partner.value]?.[sf.key] as string) || ""
                    }
                    onChange={(e) =>
                      handleSubFieldChange(
                        partner.value,
                        sf.key,
                        e.target.value || null
                      )
                    }
                    disabled={disabled}
                    className="input-field max-w-md"
                  >
                    <option value="">Select...</option>
                    {sf.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={
                      (partnerData[partner.value]?.[sf.key] as string) || ""
                    }
                    onChange={(e) =>
                      handleSubFieldChange(
                        partner.value,
                        sf.key,
                        e.target.value
                      )
                    }
                    disabled={disabled}
                    className="input-field"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
