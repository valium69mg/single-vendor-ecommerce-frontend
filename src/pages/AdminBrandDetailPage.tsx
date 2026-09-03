import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Pencil } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getAdminBrand, deleteBrand } from "@/api/api";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import Modal from "@/components/common/Modal";
import EditBrandForm from "@/components/brands/EditBrandForm";
import DestructiveActionButton from "@/components/common/DestructiveActionButton";
import { Button } from "@/components/ui/button";
import Loader from "@/components/common/Loader";
import { useToast } from "@/hooks/useToast";

export default function AdminBrandDetailPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useUser();
  const { throwOnError, handleError } = useApiErrorHandler();
  const { success } = useToast();
  const queryClient = useQueryClient();

  const id = Number(brandId);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "brand", id],
    queryFn: () => getAdminBrand(id, user!.token),
    enabled: !!user?.token && !isNaN(id),
    throwOnError,
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: () => deleteBrand(id, user!.token),
    onSuccess: () => {
      success(t("brandDeletedSuccessfully"));
      queryClient.invalidateQueries({ queryKey: ["admin", "brands"] });
      navigate("/admin/brands");
    },
    onError: (err: Error) => handleError(err, t("brandNotDeletedSuccessfully")),
  });

  const BackButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate("/admin/brands")}
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
        <p className="text-muted-foreground">{t("brandNotFound")}</p>
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
            ID: {data.brandId}
          </span>
          <span className="font-store-body text-xs text-stone-400 border border-stone-200 rounded-none px-2 py-0.5">
            {t("slug")}: {data.slug}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Modal
          buttonName={<Pencil className="h-3.5 w-3.5" />}
          triggerClassName="h-8 w-8 p-0 text-stone-600 hover:text-stone-900 hover:border-stone-400"
          content={(onClose) => (
            <EditBrandForm brandId={data.brandId} onClose={onClose} />
          )}
        />
        <DestructiveActionButton onConfirm={handleDelete} />
      </div>
    </div>
  );
}
