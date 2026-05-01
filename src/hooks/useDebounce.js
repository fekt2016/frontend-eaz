import { useState, useEffect } from "react";

export function useDebounce(value, delay) {
  if (delay === undefined) delay = 500;
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}
