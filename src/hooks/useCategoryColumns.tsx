import type { ColumnDef } from "@tanstack/react-table";
import type { Category } from "@/api/api";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { API_FILE_URL } from "@/api/api";
import { useTranslation } from "react-i18next";
import DestructiveActionButton from "../components/common/DestructiveActionButton";
import Modal from "@/components/common/Modal";
import EditCategoryForm from "@/components/categories/EditCategoryForm";
import ImageModal from "@/components/common/ImageModal";
import EditImageForm from "@/components/common/EditImageForm";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";

export function useCategoryColumns(
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
          <ImageModal
            imageWithFallback={
              <ImageWithFallback
                src={API_FILE_URL + key}
                alt={row.original.name}
                className="w-12 h-12 object-cover rounded"
              />
            }
            content={(onClose) => (
              <EditImageForm
                categoryId={row.original.categoryId}
                initialImageUrl={key ? API_FILE_URL + key : undefined}
                onClose={onClose}
              />)
            }
          />
        );
      },
    },
    {
      accessorKey: "name",
      header: t("categories"),
      cell: ({ row }) => (
        <Link
          to={`/admin/categories/${row.original.categoryId}`}
          className="hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
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
          <div className="flex gap-1.5">
            <Modal
              buttonName={<Pencil className="h-3.5 w-3.5" />}
              content={(onClose) => (
                <EditCategoryForm
                  categoryId={category.categoryId}
                  onClose={onClose}
                />
              )}
              triggerClassName="h-8 w-8 p-0 text-stone-600 hover:text-stone-900 hover:border-stone-400"
            />
            <DestructiveActionButton onConfirm={() => onDelete(category)} />
          </div>
        );
      },
    },
  ];
}
