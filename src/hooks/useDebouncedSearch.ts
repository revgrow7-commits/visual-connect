import { useState, useEffect, useCallback, useRef } from "react";

/** Debounced string state for search inputs */
export function useDebouncedSearch(delay = 300) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const setValue = useCallback((val: string) => {
    setInputValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedValue(val), delay);
  }, [delay]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { inputValue, debouncedValue, setSearch: setValue };
}
