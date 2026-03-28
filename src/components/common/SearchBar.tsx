"use client";

import { useEffect, useState } from "react";
import useDebounce from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  query: string;
  setQuery: (value: string) => void;
}

interface SearchBarProps {
  query: string;
  setQuery: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function SearchBar({ query, setQuery, className, placeholder }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(query);
  const debouncedValue = useDebounce({ value: inputValue, delay: 600 });

  useEffect(() => {
    setQuery(debouncedValue);
  }, [debouncedValue, setQuery]);

  return (
    <Input
      type="text"
      placeholder={placeholder ?? ""}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      className={className}
    />
  );
}
