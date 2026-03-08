import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import type { Category } from "@/api/api";
import { getCategories } from "@/api/api";
import type { ColumnDef } from "@tanstack/react-table";
import { useUser } from "@/hooks/useUser";

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const { user, logout } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const size = 20;

  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      if (!user?.token) return;
      const data = await getCategories(page, size, user.token, logout);

      setCategories(data);
      setHasNextPage(data.length === size);

      setLoading(false);
    };

    loadCategories();
  }, [page, user?.token, user, logout]);
  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "categoryId",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: t("categories"),
    },
    {
      accessorKey: "products",
      header: t("products"),
    },
    {
      accessorKey: "unitsSold",
      header: t("unitsSold"),
    },
    {
      accessorKey: "revenue",
      header: t("revenue"),
    },
    {
      accessorKey: "averagePrice",
      header: t("averagePrice"),
    },
    {
      accessorKey: "stock",
      header: t("stock"),
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const category = row.original;

        return (
          <div className="flex gap-2 justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log("edit", category)}
            >
              {t("edit")}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => console.log("delete", category)}
            >
              {t("delete")}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("categories")}</h1>

        <Button>+ {t("categories")}</Button>
      </div>

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
