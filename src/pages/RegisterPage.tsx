import RegisterForm from "@/components/auth/RegisterForm";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function RegisterPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full bg-stone-950 flex flex-col items-center justify-center px-4 sm:px-6 gap-8">
      {/* Brand mark */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 bg-amber-700 flex items-center justify-center">
          <span className="text-white font-bold text-xl font-store-heading">J</span>
        </div>
        <span className="font-store-heading text-2xl font-semibold text-white tracking-wide">
          Joyería
        </span>
      </div>
      <RegisterForm />
      <Link
        to="/login"
        className="text-sm text-stone-400 hover:text-stone-200 underline-offset-4 hover:underline"
      >
        {t("auth.register.haveAccount")}
      </Link>
    </div>
  );
}
