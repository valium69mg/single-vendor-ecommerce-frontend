import type { ColumnDef } from "@tanstack/react-table";
import type { AdminProduct } from "@/api/api";
import { getFileUrl } from "@/api/api";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-store-body font-medium border rounded-none",
        status === "ACTIVE" &&
          "border-green-300 bg-green-50 text-green-700",
        status === "INACTIVE" &&
          "border-red-300 bg-red-50 text-red-700",
        status === "DRAFT" &&
          "border-stone-300 bg-stone-50 text-stone-500",
        !["ACTIVE", "INACTIVE", "DRAFT"].includes(status) &&
          "border-stone-300 bg-stone-50 text-stone-500",
      )}
    >
      {status}
    </span>
  );
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
      accessorKey: "productId",
      header: "ID",
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
      accessorKey: "price",
      header: t("price"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-700">
          ${row.original.price.toFixed(2)}
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
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
      accessorKey: "categoryName",
      header: t("category"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-600 text-sm">
          {row.original.categoryName ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "brandName",
      header: t("brands"),
      cell: ({ row }) => (
        <span className="font-store-body text-stone-600 text-sm">
          {row.original.brandName ?? "—"}
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
