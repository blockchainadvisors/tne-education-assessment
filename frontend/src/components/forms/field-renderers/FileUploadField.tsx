"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import type { Item } from "@/lib/types";
import { Spinner } from "@/components/ui";

interface Props {
  item: Item;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id?: string;
}

interface FileInfo {
  filename: string;
  file_id?: string;
  file_size?: number;
}

export function FileUploadField({ item, value, onChange, disabled, id }: Props) {
  const files: FileInfo[] = Array.isArray(value) ? value : [];
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const allowedTypes = item.validation?.allowed_file_types || [];
  const maxSizeMB = item.validation?.max_file_size_mb || 10;

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;
      setUploading(true);

      const newFiles: FileInfo[] = [...files];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        // Client-side validation
        if (file.size > maxSizeMB * 1024 * 1024) {
          continue; // Skip files that are too large
        }
        newFiles.push({
          filename: file.name,
          file_size: file.size,
        });
      }

      onChange(newFiles);
      setUploading(false);
    },
    [files, onChange, disabled, maxSizeMB]
  );

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated.length > 0 ? updated : null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        id={id}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Upload files"
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            document.getElementById(`file-input-${item.id}`)?.click();
          }
        }}
        className={`flex flex-col items-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
          isDragging
            ? "border-brand-400 bg-brand-50"
            : "border-slate-300 hover:border-slate-400"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        onClick={() => {
          if (!disabled) {
            document.getElementById(`file-input-${item.id}`)?.click();
          }
        }}
      >
        {uploading ? (
          <Spinner size="lg" className="text-brand-500" />
        ) : (
          <Upload className="h-8 w-8 text-slate-400" />
        )}
        <p className="mt-2 text-sm font-medium text-slate-700">
          {isDragging ? "Drop files here" : "Click or drag files to upload"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {allowedTypes.length > 0
            ? `Accepted: ${allowedTypes.join(", ")}`
            : "All file types accepted"}
          {" | "}Max {maxSizeMB}MB
        </p>
        <input
          id={`file-input-${item.id}`}
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
          className="hidden"
          accept={allowedTypes.length > 0 ? allowedTypes.join(",") : undefined}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-slate-700">{file.filename}</span>
                {file.file_size && (
                  <span className="text-xs text-slate-400">
                    ({(file.file_size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
