import { useEffect } from "react";
import { useState } from "react";

interface useDebounceProps {
  value: string;
  delay: number;
}

export default function useDebounce({ value, delay }: useDebounceProps) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}
