import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { restoreMaterial } from "@/api/api";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/useToast";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";

interface RestoreMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: number;
  onRestored: () => void;
  onUseDifferentName: () => void;
}

export default function RestoreMaterialDialog({
  open,
  onOpenChange,
  materialId,
  onRestored,
  onUseDifferentName,
}: RestoreMaterialDialogProps) {
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const { handleError } = useApiErrorHandler();

  const { mutate: handleRestore, isPending } = useMutation({
    mutationFn: () =>
      restoreMaterial({ materialId, token: user?.token || "" }),
    onSuccess: (data) => {
      success(data?.message || t("materialRestoredSuccessfully"));
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
      onRestored();
    },
    onError: (err: Error) =>
      handleError(err, t("materialNotRestoredSuccessfully")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none rounded-none w-auto max-w-none">
        <div className="bg-white border border-stone-200 shadow-lg rounded-none w-full max-w-md p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-store-heading text-xl font-semibold text-stone-900">
              {t("restoreMaterialTitle")}
            </h2>
            <p className="font-store-body text-sm text-stone-600">
              {t("restoreMaterialDescription")}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              className="w-full flex justify-center items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white hover:text-white rounded-none h-11 font-store-body text-sm tracking-wide"
              disabled={isPending}
              onClick={() => handleRestore()}
            >
              {isPending && <Spinner className="w-5 h-5" />}
              {t("restoreMaterial")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-none w-full border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900 font-store-body text-sm"
              disabled={isPending}
              onClick={onUseDifferentName}
            >
              {t("useDifferentName")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
