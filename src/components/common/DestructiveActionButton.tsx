import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Trash } from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface DestructiveActionButtonProps {
  onConfirm: () => void;
  label?: string;
  size?: "sm" | "default" | "lg";
}
export default function DestructiveActionButton({
  onConfirm,
  label,
  size = "sm",
}: DestructiveActionButtonProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size={size}
          className={cn(!label && "h-8 w-8 p-0 rounded-none")}
        >
          {label ? (
            <><Trash size={ICON.sm} aria-hidden />{label}</>
          ) : (
            <Trash size={ICON.sm} aria-hidden />
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("areYouSure")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("cannotUndo")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction variant={"destructive"} onClick={onConfirm}>
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}