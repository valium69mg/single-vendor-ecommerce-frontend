import type { ColumnDef } from "@tanstack/react-table";
import type { Category } from "@/api/api";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { getFileUrl } from "@/api/api";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import DestructiveActionButton from "../components/common/DestructiveActionButton";
import Modal from "@/components/common/Modal";
import EditCategoryForm from "@/components/categories/EditCategoryForm";
import ImageModal from "@/components/common/ImageModal";
import EditImageForm from "@/components/common/EditImageForm";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { formatDate } from "@/lib/formatDate";

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
      header: t("image"),
      cell: ({ row }) => {
        const key = row.original.smallThumbnailUrl;

        return (
          <ImageModal
            imageWithFallback={
              <ImageWithFallback
                src={getFileUrl(key)}
                alt={row.original.name}
                className="w-12 h-12 object-cover rounded"
              />
            }
            content={(onClose) => (
              <EditImageForm
                categoryId={row.original.categoryId}
                initialImageUrl={key ? getFileUrl(key) : undefined}
                onClose={onClose}
              />
            )}
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
      cell: ({ row }) => (
        <span className="font-store-body text-stone-700">
          {row.original.products}
        </span>
      ),
    },
    {
      accessorKey: "unitsSold",
      header: t("unitsSold"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-700">
          {row.original.unitsSold}
        </span>
      ),
    },
    {
      accessorKey: "revenue",
      header: t("revenue"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-700">
          ${row.original.revenue.toLocaleString("es-ES")}
        </span>
      ),
    },
    {
      accessorKey: "averagePrice",
      header: t("averagePrice"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-700">
          ${row.original.averagePrice.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "stock",
      header: t("stock"),
      cell: ({ row }) => (
        <span
          className={cn(
            "font-store-body",
            row.original.stock <= 10 && row.original.stock > 0
              ? "text-amber-700 font-medium"
              : row.original.stock === 0
                ? "text-red-600 font-medium"
                : "text-stone-700",
          )}
        >
          {row.original.stock}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: t("createdAt"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-500 text-xs whitespace-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: t("updatedAt"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-500 text-xs whitespace-nowrap">
          {formatDate(row.original.updatedAt)}
        </span>
      ),
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
