// components/navbar/NavbarLogo.tsx
import { useNavigate } from "react-router-dom";

export default function NavbarLogo() {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center gap-2 cursor-pointer shrink-0"
      onClick={() => navigate("/")}
    >
      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">S</span>
      </div>
      <span className="font-semibold text-lg hidden sm:block">Tu tienda</span>
    </div>
  );
}