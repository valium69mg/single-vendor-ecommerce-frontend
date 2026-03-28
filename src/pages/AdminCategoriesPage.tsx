import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import type { Category, PageResponse } from "@/api/api";
import { getCategories, deleteCategory } from "@/api/api";
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
  const [hasNextPage, setHasNextPage] = useState(false);
  const size = 10;

  const loadCategories = useCallback(async () => {
    if (!user?.token) {
      return logout();
    }

    setLoading(true);

    try {
      const response: PageResponse<Category> = await getCategories(
        page,
        size,
        user.token,
        term,
        logout,
      );

      setCategories(response.content);
      setHasNextPage(!response.last);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  }, [page, size, user?.token, term, logout]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setPage(0);
  }, [term]);

  const handleEdit = (category: Category) => {
    console.log("edit", category);
  };

  const handleDelete = async (category: Category) => {
    if (!user?.token) return logout();

    try {
      await deleteCategory(category.categoryId, user.token, logout);
      await loadCategories();
    } catch (err) {
      console.error("Failed to delete category", err);
    }
  };

  const columns = useCategoryColumns(handleEdit, handleDelete);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("categories")}</h1>

        <Button>+ {t("categories")}</Button>
      </div>

      <SearchBar query={term} setQuery={setTerm} />

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
