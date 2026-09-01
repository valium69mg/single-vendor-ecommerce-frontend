import LoginForm from "@/components/auth/LoginForm";
import { useUser } from "../hooks/useUser";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "../constants/roles";

export default function LoginPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === ROLES.ADMIN) {
        navigate("/admin", { replace: true });
      } else if (user.role === ROLES.USER) {
        navigate("/", { replace: true });
      } else {
        // Any other/unknown role: never strand an authenticated user on login.
        navigate("/", { replace: true });
      }
    }
  }, [user, navigate]);

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
      <LoginForm />
    </div>
  );
}
