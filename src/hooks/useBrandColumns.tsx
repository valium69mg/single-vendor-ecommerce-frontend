import type { ColumnDef } from "@tanstack/react-table";
import type { AdminBrand } from "@/api/api";
import { useTranslation } from "react-i18next";
import DestructiveActionButton from "@/components/common/DestructiveActionButton";
import Modal from "@/components/common/Modal";
import EditBrandForm from "@/components/brands/EditBrandForm";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";

export function useBrandColumns(
  onDelete: (brand: AdminBrand) => void,
): ColumnDef<AdminBrand>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "brandId",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: t("brands"),
      cell: ({ row }) => (
        <Link
          to={`/admin/brands/${row.original.brandId}`}
          className="hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const brand = row.original;

        return (
          <div className="flex gap-1.5">
            <Modal
              buttonName={<Pencil className="h-3.5 w-3.5" />}
              content={(onClose) => (
                <EditBrandForm brandId={brand.brandId} onClose={onClose} />
              )}
              triggerClassName="h-8 w-8 p-0 text-stone-600 hover:text-stone-900 hover:border-stone-400"
            />
            <DestructiveActionButton onConfirm={() => onDelete(brand)} />
          </div>
        );
      },
    },
  ];
}
