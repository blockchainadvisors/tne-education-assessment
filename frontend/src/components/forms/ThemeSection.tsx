"use client";

import type { Theme, Item } from "@/lib/types";
import { getFieldRenderer } from "./field-renderers";

interface ThemeSectionProps {
  theme: Theme;
  responseMap: Record<string, unknown>;
  onFieldChange: (itemId: string, value: unknown) => void;
  disabled?: boolean;
}

/**
 * Renders all items for a theme, delegating to the appropriate field renderer
 * based on each item's field_type.
 */
export function ThemeSection({
  theme,
  responseMap,
  onFieldChange,
  disabled = false,
}: ThemeSectionProps) {
  const sortedItems = [...theme.items].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {sortedItems.map((item: Item) => {
        const FieldRenderer = getFieldRenderer(item.field_type);
        const value = responseMap[item.id];

        return (
          <div key={item.id} className="group">
            <div className="mb-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-500">
                  {item.code}
                </span>
                <div className="min-w-0 flex-1">
                  <label htmlFor={`field-${item.id}`} className="label">
                    {item.label}
                    {item.validation?.required && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </label>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.description}
                    </p>
                  )}
                  {item.help_text && (
                    <p className="mt-0.5 text-xs italic text-slate-400">
                      {item.help_text}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="pl-0 sm:pl-12">
              <FieldRenderer
                item={item}
                value={value}
                onChange={(val) => onFieldChange(item.id, val)}
                disabled={disabled}
                id={`field-${item.id}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
