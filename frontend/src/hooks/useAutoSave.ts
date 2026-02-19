"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook that debounces value changes and calls the save function
 * after a specified delay of inactivity.
 *
 * @param value - The value to watch for changes
 * @param saveFn - The async function to call when saving
 * @param delay - Debounce delay in milliseconds (default: 2000)
 */
export function useAutoSave<T>(
  value: T,
  saveFn: (value: T) => Promise<void>,
  delay: number = 2000
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef = useRef(saveFn);
  const valueRef = useRef(value);
  const isFirstRender = useRef(true);

  // Keep the save function ref up to date
  saveFnRef.current = saveFn;
  valueRef.current = value;

  useEffect(() => {
    // Skip the first render to avoid saving initial values
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Don't schedule save if value is empty object
    if (
      typeof value === "object" &&
      value !== null &&
      Object.keys(value as Record<string, unknown>).length === 0
    ) {
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveFnRef.current(valueRef.current);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);
}
