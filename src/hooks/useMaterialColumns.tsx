import type { ColumnDef } from "@tanstack/react-table";
import type { AdminMaterial } from "@/api/api";
import { useTranslation } from "react-i18next";
import DestructiveActionButton from "@/components/common/DestructiveActionButton";
import Modal from "@/components/common/Modal";
import EditMaterialForm from "@/components/materials/EditMaterialForm";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";

export function useMaterialColumns(
  onDelete: (material: AdminMaterial) => void,
): ColumnDef<AdminMaterial>[] {
  const { t } = useTranslation();

  return [
    {
      accessorKey: "materialId",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: t("materials"),
      cell: ({ row }) => (
        <Link
          to={`/admin/materials/${row.original.materialId}`}
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
        const material = row.original;

        return (
          <div className="flex gap-1.5">
            <Modal
              buttonName={<Pencil className="h-3.5 w-3.5" />}
              content={(onClose) => (
                <EditMaterialForm
                  materialId={material.materialId}
                  onClose={onClose}
                />
              )}
              triggerClassName="h-8 w-8 p-0 text-stone-600 hover:text-stone-900 hover:border-stone-400"
            />
            <DestructiveActionButton onConfirm={() => onDelete(material)} />
          </div>
        );
      },
    },
  ];
}
