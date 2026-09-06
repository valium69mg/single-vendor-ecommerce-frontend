import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar/Navbar";
import { Spinner } from "@/components/ui/spinner";
import { getCategories } from "@/api/api";

const PAGE_SIZE = 100;

export default function CategoriesListPage() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["categories", "list"],
    queryFn: () => getCategories(0, PAGE_SIZE, ""),
  });

  const categories = data?.content ?? [];

  return (
    <div className="flex min-h-dvh flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-store-heading text-3xl text-stone-900">
          {t("categoriesList.title")}
        </h1>

        <div className="mt-8">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner className="h-6 w-6" />
            </div>
          ) : categories.length === 0 ? (
            <p className="font-store-body text-sm text-stone-500">
              {t("categoriesList.empty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {categories.map((category) => (
                <li key={category.categoryId}>
                  <Link
                    to={`/category/${category.slug}`}
                    className="font-store-body text-base text-stone-700 transition-colors hover:text-amber-700"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
