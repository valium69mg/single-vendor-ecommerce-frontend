import { useState } from "react";
import SearchBar from "@/components/common/SearchBar";

export default function NavbarSearch() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex items-center gap-2 w-full">
      <SearchBar
        query={query}
        setQuery={setQuery}
        className="w-full h-10 text-base"
        placeholder="Search products..."
      />

    </div>
  );
}