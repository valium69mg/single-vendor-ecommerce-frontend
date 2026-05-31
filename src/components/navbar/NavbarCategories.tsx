import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { getCategories } from "@/api/api";
import { useUser } from "@/hooks/useUser";
import { useQuery } from "@tanstack/react-query";
import { useApiErrorHandler } from "@/hooks/useApiErrorHandler";
import { Spinner } from "@/components/ui/spinner";

const DEFAULT_NAVBAR_CATEGORIES_NUMBER = 5;
const DEFAULT_NAVBAR_CATEGORIES_PAGE = 0;

export default function NavbarCategories() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { throwOnError } = useApiErrorHandler();

  const { data, isLoading } = useQuery({
    queryKey: [
      "categories",
      DEFAULT_NAVBAR_CATEGORIES_PAGE,
      DEFAULT_NAVBAR_CATEGORIES_NUMBER,
      "",
    ],
    queryFn: () =>
      getCategories(
        DEFAULT_NAVBAR_CATEGORIES_PAGE,
        DEFAULT_NAVBAR_CATEGORIES_NUMBER,
        "",
      ),
    enabled: !!user?.token,
    throwOnError,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hidden md:flex items-center gap-1 font-store-body text-sm text-stone-700 hover:text-amber-700 transition-colors duration-150 shrink-0 outline-none">
          Categorías
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-44 rounded-none shadow-md border-stone-200 p-0"
      >
        {isLoading ? (
          <div className="flex justify-center py-3">
            <Spinner className="w-5 h-5" />
          </div>
        ) : (
          data?.content.map(({ name, categoryId }) => (
            <DropdownMenuItem
              key={categoryId}
              className="font-store-body text-sm text-stone-700 hover:text-amber-700 rounded-none cursor-pointer px-4 py-2.5"
              onClick={() => navigate(`/category/${categoryId}`)}
            >
              {name}
            </DropdownMenuItem>
          ))
        )}
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
