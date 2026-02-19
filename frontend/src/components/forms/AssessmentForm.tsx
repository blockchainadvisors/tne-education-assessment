"use client";

import type { Theme } from "@/lib/types";
import { ThemeSection } from "./ThemeSection";

interface AssessmentFormProps {
  theme: Theme;
  responseMap: Record<string, unknown>;
  onFieldChange: (itemId: string, value: unknown) => void;
  disabled?: boolean;
}

/**
 * Main assessment form component.
 * Receives a single theme and its responses, renders the ThemeSection.
 */
export function AssessmentForm({
  theme,
  responseMap,
  onFieldChange,
  disabled = false,
}: AssessmentFormProps) {
  return (
    <div className="card">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">{theme.name}</h2>
        {theme.description && (
          <p className="mt-1 text-sm text-slate-600">{theme.description}</p>
        )}
      </div>

      <ThemeSection
        theme={theme}
        responseMap={responseMap}
        onFieldChange={onFieldChange}
        disabled={disabled}
      />
    </div>
  );
}
