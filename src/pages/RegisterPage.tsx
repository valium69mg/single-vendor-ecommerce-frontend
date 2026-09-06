import RegisterForm from "@/components/auth/RegisterForm";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useRegisterFlow } from "@/hooks/useRegisterFlow";
import { ROLES } from "@/constants/roles";

type Step = "register" | "verify";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const navigate = useNavigate();
  // Reload-guard: landing on `/registro` with a stored-but-unverified
  // session (e.g. a page refresh mid-verification) starts on the verify
  // step instead of showing the register form again.
  const [step, setStep] = useState<Step>(() =>
    user && !user.isVerified ? "verify" : "register",
  );

  const { onRegistered } = useRegisterFlow({
    onUnverified: () => setStep("verify"),
  });

  // Mirrors `LoginPage`'s post-login navigation: neither `LoginForm` nor
  // `VerifyEmailForm` navigates itself, they only update the session.
  useEffect(() => {
    if (user && user.isVerified) {
      navigate(user.role === ROLES.ADMIN ? "/admin" : "/", { replace: true });
    }
  }, [user, navigate]);

  const showVerifyStep = step === "verify";

  return (
    <div className="min-h-dvh w-full bg-stone-950 flex flex-col items-center justify-center px-4 sm:px-6 gap-8">
      {/* Brand mark */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 bg-amber-700 flex items-center justify-center">
          <span className="text-white font-bold text-xl font-store-heading">J</span>
        </div>
        <span className="font-store-heading text-2xl font-semibold text-white tracking-wide">
          Joyería
        </span>
      </div>
      {showVerifyStep ? (
        <VerifyEmailForm />
      ) : (
        <RegisterForm onRegistered={onRegistered} />
      )}
      {!showVerifyStep && (
        <Link
          to="/login"
          className="text-sm text-stone-400 hover:text-stone-200 underline-offset-4 hover:underline"
        >
          {t("auth.register.haveAccount")}
        </Link>
      )}
    </div>
  );
}
