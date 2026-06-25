import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/common/DataTable";
import type { Category } from "@/api/api";
import { getAdminCategories, deleteCategory } from "@/api/api";
import { useUser } from "@/hooks/useUser";
import SearchBar from "@/components/common/SearchBar";
import { useCategoryColumns } from "@/hooks/useCategoryColumns";
import { useToast } from "@/hooks/useToast";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import Modal from "@/components/common/Modal";
import CreateCategoryForm from "@/components/categories/CreateCategoryForm";

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
    queryKey: ["admin", "categories", page, term],
    queryFn: () => getAdminCategories(page, SIZE, term, user!.token),
    enabled: !!user?.token,
    throwOnError,
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: (category: Category) =>
      deleteCategory(category.categoryId, user!.token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      success(t("categoryDeletedSuccessfully"));
    },
    onError: (err: Error) =>
      handleError(err, t("categoryNotDeletedSuccessfully")),
  });

  const columns = useCategoryColumns(handleDelete);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-store-heading text-3xl font-semibold text-stone-900">{t("categories")}</h1>
        <Modal
          buttonName={`+ ${t("createCategory")}`}
          content={(onClose) => <CreateCategoryForm onClose={onClose} />}
          triggerClassName="bg-stone-900 hover:bg-stone-800 text-white hover:text-white border-stone-900 hover:border-stone-800 font-store-body text-sm tracking-wide h-9 px-4"
        />
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

      <div className="overflow-x-auto">
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
    </div>
  );
}
