import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { restoreCategory } from "@/api/api";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/useToast";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";

interface RestoreCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number;
  onRestored: () => void;
  onUseDifferentName: () => void;
}

export default function RestoreCategoryDialog({
  open,
  onOpenChange,
  categoryId,
  onRestored,
  onUseDifferentName,
}: RestoreCategoryDialogProps) {
  const { t } = useTranslation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const { handleError } = useApiErrorHandler();

  const { mutate: handleRestore, isPending } = useMutation({
    mutationFn: () => restoreCategory({ categoryId, token: user?.token || "" }),
    onSuccess: (data) => {
      success(data?.message || t("categoryRestoredSuccessfully"));
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      onRestored();
    },
    onError: (err: Error) => handleError(err, t("categoryNotRestoredSuccessfully")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none rounded-none w-auto max-w-none">
        <div className="bg-white border border-stone-200 shadow-lg rounded-none w-full max-w-md p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-store-heading text-xl font-semibold text-stone-900">
              {t("restoreCategoryTitle")}
            </h2>
            <p className="font-store-body text-sm text-stone-600">
              {t("restoreCategoryDescription")}
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
              {t("restoreCategory")}
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
