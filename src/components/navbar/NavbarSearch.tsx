import { useState } from "react";
import SearchBar from "@/components/common/SearchBar";
import { useTranslation } from "react-i18next";
export default function NavbarSearch() {
  const [query, setQuery] = useState("");
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 w-full">
      <SearchBar
        query={query}
        setQuery={setQuery}
        className="w-full h-10 text-base"
        placeholder={t('searchFor') + " " + t('products').toLowerCase() + "..."}
      />

    </div>
  );
}