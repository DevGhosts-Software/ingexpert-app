import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * of no changes. Use it to throttle expensive operations (API calls, DB
 * queries) that should not fire on every keystroke.
 *
 * @example
 * const debouncedSearch = useDebounce(search, 400);
 * // Pass debouncedSearch to the tRPC query instead of the raw state.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
