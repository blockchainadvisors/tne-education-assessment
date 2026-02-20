"use client";

import { CheckCircle2, XCircle, FileText, Paperclip } from "lucide-react";
import type { Item } from "@/lib/types";

interface Props {
  item: Item;
  value: unknown;
}

/**
 * Read-only renderer for assessment response values.
 * Renders each field type in a human-readable format.
 */
export function ResponseDisplay({ item, value }: Props) {
  if (value === undefined || value === null || value === "") {
    return <span className="italic text-slate-400">No response</span>;
  }

  switch (item.field_type) {
    case "short_text":
      return <p className="text-sm text-slate-700">{String(value)}</p>;

    case "long_text":
      return (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {String(value)}
        </p>
      );

    case "numeric":
      return <p className="text-lg font-semibold text-slate-900">{String(value)}</p>;

    case "percentage":
      return <p className="text-lg font-semibold text-slate-900">{String(value)}%</p>;

    case "auto_calculated":
      return <p className="text-lg font-semibold text-brand-600">{String(value)}</p>;

    case "dropdown":
      return (
        <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
          {String(value)}
        </span>
      );

    case "multi_select":
      return <MultiSelectDisplay value={value} />;

    case "yes_no_conditional":
      return <YesNoDisplay value={value} />;

    case "multi_year_gender":
      return <MultiYearDisplay value={value} />;

    case "salary_bands":
      return <SalaryBandsDisplay value={value} />;

    case "partner_specific":
      return <PartnerSpecificDisplay value={value} />;

    case "file_upload":
      return <FileUploadDisplay value={value} />;

    default:
      // Fallback for unknown types
      if (typeof value === "object") {
        return (
          <pre className="whitespace-pre-wrap text-xs text-slate-600">
            {JSON.stringify(value, null, 2)}
          </pre>
        );
      }
      return <p className="text-sm text-slate-700">{String(value)}</p>;
  }
}

// --- Multi Select ---

function MultiSelectDisplay({ value }: { value: unknown }) {
  const obj = value as Record<string, unknown>;
  const items: string[] = Array.isArray(obj?.selected)
    ? obj.selected
    : Array.isArray(value)
      ? (value as string[])
      : [];

  if (items.length === 0) {
    return <span className="italic text-slate-400">No selections</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-200"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// --- Yes / No Conditional ---

function YesNoDisplay({ value }: { value: unknown }) {
  const obj = value as Record<string, unknown>;
  // Support both { answer: bool, details } and { yes: bool, follow_up }
  const isYes = obj?.answer === true || obj?.yes === true;
  const isNo = obj?.answer === false || obj?.yes === false;
  const details = (obj?.details || obj?.follow_up || "") as string;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isYes ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold text-emerald-700">Yes</span>
          </>
        ) : isNo ? (
          <>
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="font-semibold text-red-600">No</span>
          </>
        ) : (
          <span className="italic text-slate-400">Not answered</span>
        )}
      </div>
      {details && (
        <div className="ml-7 border-l-2 border-slate-200 pl-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {details}
          </p>
        </div>
      )}
    </div>
  );
}

// --- Multi Year Gender / Trend Data ---

function MultiYearDisplay({ value }: { value: unknown }) {
  const obj = value as Record<string, unknown>;
  const years = (obj?.years || []) as Record<string, unknown>[];

  if (years.length === 0) {
    return <span className="italic text-slate-400">No data</span>;
  }

  // Detect columns: always show year, then detect gender or total
  const sample = years[0];
  const hasGender = "male" in sample || "female" in sample;
  const hasTotal = "total" in sample;

  if (hasGender) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-2 pr-4 font-semibold text-slate-600">Year</th>
              <th className="pb-2 pr-4 font-semibold text-slate-600">Male</th>
              <th className="pb-2 pr-4 font-semibold text-slate-600">Female</th>
              <th className="pb-2 pr-4 font-semibold text-slate-600">Other</th>
              <th className="pb-2 font-semibold text-slate-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {years.map((yr, i) => {
              const male = Number(yr.male || 0);
              const female = Number(yr.female || 0);
              const other = Number(yr.other || 0);
              const unknown = Number(yr.unknown || 0);
              const total = male + female + other + unknown;
              return (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">{String(yr.year)}</td>
                  <td className="py-2 pr-4 text-slate-700">{male.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-slate-700">{female.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-slate-700">{other.toLocaleString()}</td>
                  <td className="py-2 font-medium text-slate-900">{total.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (hasTotal) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-2 pr-4 font-semibold text-slate-600">Year</th>
              <th className="pb-2 font-semibold text-slate-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {years.map((yr, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">{String(yr.year)}</td>
                <td className="py-2 font-medium text-slate-900">{Number(yr.total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Generic key-value table fallback
  const keys = Object.keys(sample).filter((k) => k !== "year");
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="pb-2 pr-4 font-semibold text-slate-600">Year</th>
            {keys.map((k) => (
              <th key={k} className="pb-2 pr-4 font-semibold capitalize text-slate-600">
                {k.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map((yr, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-2 pr-4 font-medium text-slate-900">{String(yr.year)}</td>
              {keys.map((k) => (
                <td key={k} className="py-2 pr-4 text-slate-700">{String(yr[k] ?? "—")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Salary Bands ---

function SalaryBandsDisplay({ value }: { value: unknown }) {
  const obj = value as Record<string, unknown>;
  const bands = obj?.bands as Record<string, Record<string, unknown>> | undefined;

  if (!bands || Object.keys(bands).length === 0) {
    return <span className="italic text-slate-400">No data</span>;
  }

  // Sort by value ascending
  const entries = Object.entries(bands).sort(
    (a, b) => Number(a[1].value || 0) - Number(b[1].value || 0)
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="pb-2 pr-4 font-semibold text-slate-600">Band</th>
            <th className="pb-2 font-semibold text-slate-600">Salary</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([band, data]) => (
            <tr key={band} className="border-b border-slate-100">
              <td className="py-2 pr-4 font-medium text-slate-900">{band}</td>
              <td className="py-2 text-slate-700">
                {data.currency ? `${data.currency} ` : ""}
                {Number(data.value).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Partner Specific ---

function PartnerSpecificDisplay({ value }: { value: unknown }) {
  if (typeof value !== "object" || value === null) {
    return <p className="text-sm text-slate-700">{String(value)}</p>;
  }

  const obj = value as Record<string, unknown>;
  const entries = Object.entries(obj);

  return (
    <div className="space-y-2">
      {entries.map(([key, val]) => (
        <div key={key} className="flex gap-2 text-sm">
          <span className="font-medium capitalize text-slate-600">
            {key.replace(/_/g, " ")}:
          </span>
          <span className="text-slate-700">
            {typeof val === "object" ? JSON.stringify(val) : String(val ?? "—")}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- File Upload ---

function FileUploadDisplay({ value }: { value: unknown }) {
  if (!value || (typeof value === "object" && Object.keys(value as object).length === 0)) {
    return <span className="italic text-slate-400">No file uploaded</span>;
  }

  const obj = value as Record<string, unknown>;
  const filename = (obj?.original_filename || obj?.filename || obj?.name || "Uploaded file") as string;
  const fileUrl = obj?.url as string | undefined;

  return (
    <div className="flex items-center gap-2">
      {fileUrl ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-brand-600 transition-colors hover:bg-brand-50"
        >
          <Paperclip className="h-4 w-4" />
          {filename}
        </a>
      ) : (
        <span className="inline-flex items-center gap-2 text-sm text-slate-600">
          <FileText className="h-4 w-4" />
          {filename}
        </span>
      )}
    </div>
  );
}
