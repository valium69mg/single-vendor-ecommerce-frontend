import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const NAV_CATEGORIES = [
  { label: "Anillos", slug: "rings" },
  { label: "Collares", slug: "necklaces" },
  { label: "Aretes", slug: "earrings" },
  { label: "Pulseras", slug: "bracelets" },
];

export default function NavbarCategories() {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hidden md:flex items-center gap-1 font-store-body text-sm text-stone-700 hover:text-amber-700 transition-colors duration-150 shrink-0 outline-none">
          Categorías
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 rounded-none shadow-md border-stone-200 p-0">
        {NAV_CATEGORIES.map(({ label, slug }) => (
          <DropdownMenuItem
            key={slug}
            className="font-store-body text-sm text-stone-700 hover:text-amber-700 rounded-none cursor-pointer px-4 py-2.5"
            onClick={() => navigate(`/products/${slug}`)}
          >
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          className="font-store-body text-sm text-amber-700 font-medium rounded-none cursor-pointer px-4 py-2.5 border-t border-stone-100"
          onClick={() => navigate("/categories")}
        >
          Ver todas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}