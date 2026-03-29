import { useTranslation } from "react-i18next";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/useToast";
import { API_ERRORS } from "@/constants/apiErrors";
import { handleUnauthorized } from "@/lib/authHandler";

export function useApiErrorHandler() {
  const { t } = useTranslation();
  const { logout } = useUser();
  const { error } = useToast();

  const handleError = (err: Error, fallbackMessage?: string) => {
    if (err.message === API_ERRORS.UNAUTHORIZED) {
      handleUnauthorized(logout);
    } else if (err.message === API_ERRORS.FORBIDDEN) {
      error(t("notEnoughPermissions"));
    } else if (fallbackMessage) {
      error(fallbackMessage);
    }
  };

  const throwOnError = (err: Error) => {
    handleError(err);
    return false;
  };

  return { handleError, throwOnError };
}