import { Form } from "../common/Form";
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { useTranslation } from "react-i18next";
import GenericButton from "../common/GenericButton";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { verifyRequest, resendCodeRequest } from "../../api/api";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/useToast";

// Digits-only 6-char code, matching the backend's `\d{6}` contract.
function sanitizeCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export default function VerifyEmailForm() {
  const { t } = useTranslation();
  const { user, setUser } = useUser();
  const { success } = useToast();
  const [code, setCode] = useState("");
  const email = user?.email ?? "";

  const verifyMutation = useMutation<void, Error, string>({
    mutationFn: (submittedCode) => verifyRequest({ email, code: submittedCode }),
    onSuccess: () => {
      if (user) setUser({ ...user, isVerified: true });
    },
  });

  const resendMutation = useMutation<void, Error, void>({
    mutationFn: () => resendCodeRequest({ email }),
    onSuccess: () => success(t("auth.verify.resent")),
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    verifyMutation.mutate(code);
  };

  return (
    <form onSubmit={onSubmit}>
      <Form
        title={t("auth.verify.title")}
        description={t("auth.verify.description", { email })}
        content={
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="verificationCode">{t("auth.verify.codeLabel")}</Label>
              <Input
                id="verificationCode"
                inputMode="numeric"
                maxLength={6}
                pattern="\d{6}"
                value={code}
                onChange={(event) => setCode(sanitizeCode(event.target.value))}
                className="rounded-none text-center tracking-[1em]"
              />
            </div>
            {verifyMutation.isError && (
              <p className="text-sm text-red-500 text-center">
                {t((verifyMutation.error as Error).message)}
              </p>
            )}
            {resendMutation.isError && (
              <p className="text-sm text-red-500 text-center">
                {t((resendMutation.error as Error).message)}
              </p>
            )}
          </div>
        }
        footerContent={
          <>
            <GenericButton
              label={t("auth.verify.submit")}
              type="submit"
              isLoading={verifyMutation.isPending}
            />
            <button
              type="button"
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              className="text-sm text-stone-500 hover:text-stone-700 underline-offset-4 hover:underline disabled:opacity-50 disabled:pointer-events-none"
            >
              {t("auth.verify.resend")}
            </button>
          </>
        }
      />
    </form>
  );
}
