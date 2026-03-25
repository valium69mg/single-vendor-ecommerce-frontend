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
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen w-full bg-primary flex items-center justify-center px-4 sm:px-6">
      <LoginForm />
    </div>
  );
}
