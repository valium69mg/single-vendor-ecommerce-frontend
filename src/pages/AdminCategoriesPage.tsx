import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import type { Category } from "@/api/api";
import { getCategories } from "@/api/api";
import { useUser } from "@/hooks/useUser";
import SearchBar from "@/components/common/SearchBar";
import { useCategoryColumns } from "@/hooks/useCategoryColumns";

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const { user, logout } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [term, setTerm] = useState("");
  const size = 20;
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);

      if (!user?.token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getCategories(page, size, user.token, term, logout);
        setCategories(data);
        setHasNextPage(data.length === size);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [page, user?.token, logout, term]);

  const handleEdit = (category: Category) => {
    console.log("edit", category);
  };

  const handleDelete = (category: Category) => {
    console.log("delete", category);
  };

  const columns = useCategoryColumns(handleEdit, handleDelete);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("categories")}</h1>

        <Button>+ {t("categories")}</Button>
      </div>

      <SearchBar
        query={term}
        setQuery={setTerm}
      />

      <DataTable
        columns={columns}
        data={categories}
        page={page}
        setPage={setPage}
        loading={loading}
        hasNextPage={hasNextPage}
        labels={{
          previous: t("previous"),
          next: t("next"),
          page: t("page"),
          noResults: t("noResults"),
        }}
      />
    </div>
  );
}