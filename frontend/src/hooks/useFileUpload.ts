"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import type { FileUpload } from "@/lib/types";

interface UseFileUploadOptions {
  assessmentId: string;
  itemId: string;
  onSuccess?: (file: FileUpload) => void;
  onError?: (error: string) => void;
}

interface UseFileUploadResult {
  upload: (file: File) => Promise<void>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

/**
 * Hook for handling file uploads with progress tracking.
 */
export function useFileUpload({
  assessmentId,
  itemId,
  onSuccess,
  onError,
}: UseFileUploadOptions): UseFileUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Simulate progress for better UX since fetch doesn't natively support progress
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const result = await apiClient.uploadFile<FileUpload>(
          `/assessments/${assessmentId}/files`,
          file,
          { item_id: itemId }
        );

        clearInterval(progressInterval);
        setProgress(100);
        onSuccess?.(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        setError(message);
        onError?.(message);
      } finally {
        setIsUploading(false);
      }
    },
    [assessmentId, itemId, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return { upload, isUploading, progress, error, reset };
}
