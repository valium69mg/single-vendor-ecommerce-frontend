import type { ColumnDef } from "@tanstack/react-table";
import type { AdminProduct } from "@/api/api";
import { getFileUrl } from "@/api/api";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import ProductStatusBadge from "@/components/products/ProductStatusBadge";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function useProductColumns(): ColumnDef<AdminProduct>[] {
  const { t } = useTranslation();

  return [
    {
      id: "image",
      header: t("image"),
      cell: ({ row }) => (
        <ImageWithFallback
          src={getFileUrl(row.original.smallThumbnailUrl)}
          alt={row.original.name}
          className="w-10 h-10 object-cover shrink-0"
        />
      ),
    },
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-900 font-medium max-w-[200px] truncate block">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "avgPrice",
      header: t("avgPrice"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-700">
          ${row.original.avgPrice}
        </span>
      ),
    },
    {
      accessorKey: "avgDiscountPrice",
      header: t("avgDiscountPrice"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-700">
          ${row.original.avgDiscountPrice}
        </span>
      ),
    },
    {
      accessorKey: "totalStock",
      header: t("stock"),
      cell: ({ row }) => (
        <span
          className={cn(
            "font-store-body",
            row.original.totalStock <= 10 && row.original.totalStock > 0
              ? "text-amber-700 font-medium"
              : row.original.totalStock === 0
                ? "text-red-600 font-medium"
                : "text-stone-700",
          )}
        >
          {row.original.totalStock}
        </span>
      ),
    },
    {
      accessorKey: "variantCount",
      header: t("variants"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-600 text-sm">
          {row.original.variantCount}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "featured",
      header: t("featured"),
      cell: ({ row }) => (
        <span
          className={cn(
            "text-xs font-store-body",
            row.original.featured
              ? "text-amber-700 font-medium"
              : "text-stone-400",
          )}
        >
          {row.original.featured ? t("yes") : t("no")}
        </span>
      ),
    },
    {
      id: "category",
      header: t("category"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-600 text-sm">
          {row.original.category?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "brand",
      header: t("brands"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-600 text-sm">
          {row.original.brand?.name ?? "—"}
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
      cell: () => (
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled
            title={t("comingSoon")}
            className="h-8 w-8 p-0 border border-stone-200 rounded-none opacity-40 cursor-not-allowed flex items-center justify-center"
          >
            <Pencil className="h-3.5 w-3.5 text-stone-500" />
          </button>
          <button
            type="button"
            disabled
            title={t("comingSoon")}
            className="h-8 w-8 p-0 border border-red-200 bg-red-50 rounded-none opacity-40 cursor-not-allowed flex items-center justify-center"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      ),
    },
  ];
}
