import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import type { Category } from "@/api/api";
import { getCategories, deleteCategory } from "@/api/api";
import { useUser } from "@/hooks/useUser";
import SearchBar from "@/components/common/SearchBar";
import { useCategoryColumns } from "@/hooks/useCategoryColumns";
import { useToast } from "@/hooks/useToast";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";

const SIZE = 10;

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [page, setPage] = useState(0);
  const [term, setTerm] = useState("");
  const { handleError, throwOnError } = useApiErrorHandler();

  const { data, isLoading } = useQuery({
    queryKey: ["categories", page, term],
    queryFn: () => getCategories(page, SIZE, user!.token, term),
    enabled: !!user?.token,
    throwOnError,
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: (category: Category) =>
      deleteCategory(category.categoryId, user!.token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      success(t("categoryDeletedSuccessfully"));
    },
    onError: (err: Error) =>
      handleError(err, t("categoryNotDeletedSuccessfully")),
  });

  const handleEdit = (category: Category) => {
    console.log("edit", category);
  };

  const columns = useCategoryColumns(handleEdit, handleDelete);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("categories")}</h1>
        <Button>+ {t("categories")}</Button>
      </div>

      <div className="w-1/2 sm:w-1/2 lg:w-1/4">
        <SearchBar
          placeholder={
            t("searchFor") + " " + t("categories").toLowerCase() + "..."
          }
          query={term}
          setQuery={(val) => {
            setTerm(val);
            setPage(0);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.content ?? []}
        page={page}
        setPage={setPage}
        loading={isLoading}
        hasNextPage={data ? !data.last : false}
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
