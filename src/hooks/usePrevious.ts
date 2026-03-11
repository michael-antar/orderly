import { useEffect, useRef } from 'react';

/**
 * Returns the value from the **previous** render cycle.
 * Returns `undefined` on the very first render before any update has been committed.
 *
 * @param value - The value to track across renders.
 * @returns The value as it was during the previous render, or `undefined` on first render.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
