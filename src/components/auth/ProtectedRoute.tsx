import { Navigate } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import type { ReactNode } from "react";
import type { Role } from "../../constants/roles";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role as Role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
