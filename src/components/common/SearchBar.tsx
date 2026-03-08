"use client";

import { useEffect, useState } from "react";
import useDebounce from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  query: string;
  setQuery: (value: string) => void;
}

export default function SearchBar({ query, setQuery }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(query);
  const debouncedValue = useDebounce({
    value: inputValue,
    delay: 600,
  });

  useEffect(() => {
    setQuery(debouncedValue);
  }, [debouncedValue, setQuery]);

  return (
    <Input
      type="text"
      placeholder=""
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      className="w-full max-w-md"
    />
  );
}
