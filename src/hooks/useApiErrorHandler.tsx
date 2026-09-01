import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/useToast";
import { API_ERRORS } from "@/constants/apiErrors";
import { handleUnauthorized } from "@/lib/authHandler";
import { useQueryClient } from "@tanstack/react-query";

export function useApiErrorHandler() {
  const { t } = useTranslation();
  const { logout } = useUser();
  const { error } = useToast();
  const queryClient = useQueryClient();

  const handleError = useCallback(
    (err: Error, fallbackMessage?: string) => {
      if (err.message === API_ERRORS.UNAUTHORIZED) {
        queryClient.cancelQueries();
        queryClient.clear();
        handleUnauthorized(logout);
      } else if (err.message === API_ERRORS.FORBIDDEN) {
        error(t("notEnoughPermissions"));
      } else if (fallbackMessage) {
        error(fallbackMessage);
      }
    },
    [t, logout, error, queryClient],
  );

  const throwOnError = useCallback(
    (err: Error) => {
      handleError(err);
      return false;
    },
    [handleError],
  );

  return { handleError, throwOnError };
}
