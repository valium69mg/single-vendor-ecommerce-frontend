import type { ColumnDef } from "@tanstack/react-table";
import type { Category } from "@/api/api";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { API_FILE_URL } from "@/api/api";
import { useTranslation } from "react-i18next";
import DestructiveActionButton from "../components/common/DestructiveActionButton";
import Modal from "@/components/common/Modal";
import EditCategoryForm from "@/components/admin/EditCategoryForm";

export function useCategoryColumns(
  onEdit: (category: Category) => void,
  onDelete: (category: Category) => void,
): ColumnDef<Category>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "categoryId",
      header: "ID",
    },
    {
      id: "image",
      header: "Image",
      cell: ({ row }) => {
        const key = row.original.smallThumbnailUrl;

        return (
          <ImageWithFallback
            src={API_FILE_URL + key}
            alt={row.original.name}
            className="w-12 h-12 object-cover rounded"
          />
        );
      },
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
          <div className="flex gap-2">
            <Modal
              buttonName={t("edit")}
              content={(onClose) => (
                <EditCategoryForm
                  categoryId={category.categoryId}
                  onClose={onClose}
                />
              )}
            />
            <DestructiveActionButton onConfirm={() => onDelete(category)} />
          </div>
        );
      },
    },
  ];
}
