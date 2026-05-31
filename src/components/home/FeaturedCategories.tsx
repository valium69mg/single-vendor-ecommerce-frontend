import SectionHeader from "./SectionHeader";
import CategoryCard from "./CategoryCard";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/api/api";
import { Spinner } from "../ui/spinner";

const DEFAULT_HOME_PAGE_CATEGORIES_NUMBER = 4;
const DEFAULT_HOME_PAGE_CATEGORIES_PAGE = 0;

export default function FeaturedCategories() {
  const { data, isLoading } = useQuery({
    queryKey: [
      "categories",
      DEFAULT_HOME_PAGE_CATEGORIES_PAGE,
      DEFAULT_HOME_PAGE_CATEGORIES_NUMBER,
      "",
    ],
    queryFn: () =>
      getCategories(
        DEFAULT_HOME_PAGE_CATEGORIES_PAGE,
        DEFAULT_HOME_PAGE_CATEGORIES_NUMBER,
        "",
      ),
  });

  return (
    <section className="bg-stone-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Nuestras Categorías"
          subtitle="Explora nuestra colección completa de joyería artesanal"
          actionLabel="Ver todas"
          actionHref="/categories"
        />
        {isLoading ? (
          <div className="flex justify-center py-3">
            <Spinner className="w-5 h-5" />
          </div>
        ) : !data?.content.length ? (
          <p className="font-store-body text-sm text-stone-400 text-center py-8">
            No hay categorías disponibles por el momento.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {data.content.map((cat) => (
              <CategoryCard key={cat.categoryId} category={cat} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
