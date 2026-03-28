import { Search } from "lucide-react";
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
      <button className="p-1 rounded-md hover:bg-muted transition-colors shrink-0">
        <Search className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
      </button>
    </div>
  );
}