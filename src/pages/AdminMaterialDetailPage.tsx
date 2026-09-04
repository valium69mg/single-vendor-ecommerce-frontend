import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Pencil } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getAdminMaterial, deleteMaterial } from "@/api/api";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import Modal from "@/components/common/Modal";
import EditMaterialForm from "@/components/materials/EditMaterialForm";
import DestructiveActionButton from "@/components/common/DestructiveActionButton";
import { Button } from "@/components/ui/button";
import Loader from "@/components/common/Loader";
import { useToast } from "@/hooks/useToast";

export default function AdminMaterialDetailPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useUser();
  const { throwOnError, handleError } = useApiErrorHandler();
  const { success } = useToast();
  const queryClient = useQueryClient();

  const id = Number(materialId);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "material", id],
    queryFn: () => getAdminMaterial(id, user!.token),
    enabled: !!user?.token && !isNaN(id),
    throwOnError,
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: () => deleteMaterial(id, user!.token),
    onSuccess: () => {
      success(t("materialDeletedSuccessfully"));
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
      navigate("/admin/materials");
    },
    onError: (err: Error) =>
      handleError(err, t("materialNotDeletedSuccessfully")),
  });

  const BackButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate("/admin/materials")}
      className="flex items-center gap-2 -ml-2"
    >
      <ArrowLeft size={16} />
      {t("back")}
    </Button>
  );

  if (isLoading) {
    return <Loader />;
  }

  if (!data) {
    return (
      <div className="space-y-4">
        {BackButton}
        <p className="text-muted-foreground">{t("materialNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {BackButton}

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-store-heading text-2xl sm:text-3xl font-semibold text-stone-900">
            {data.name}
          </h1>
          <span className="font-store-body text-xs text-stone-400 border border-stone-200 rounded-none px-2 py-0.5">
            ID: {data.materialId}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Modal
          buttonName={<Pencil className="h-3.5 w-3.5" />}
          triggerClassName="h-8 w-8 p-0 text-stone-600 hover:text-stone-900 hover:border-stone-400"
          content={(onClose) => (
            <EditMaterialForm materialId={data.materialId} onClose={onClose} />
          )}
        />
        <DestructiveActionButton onConfirm={handleDelete} />
      </div>
    </div>
  );
}
