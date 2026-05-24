import { useNavigate } from "react-router-dom";

export default function NavbarLogo() {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-center gap-2.5 cursor-pointer shrink-0"
      onClick={() => navigate("/")}
    >
      <div className="h-8 w-8 bg-amber-700 flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-sm font-store-heading">J</span>
      </div>
      <span className="font-store-heading text-xl font-semibold text-stone-900 hidden sm:block">
        Joyería
      </span>
    </div>
  );
}