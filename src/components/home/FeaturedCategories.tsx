import SectionHeader from "./SectionHeader";
import CategoryCard from "./CategoryCard";
import { MOCK_CATEGORIES } from "@/mocks/home";

export default function FeaturedCategories() {
  return (
    <section className="bg-stone-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Nuestras Categorías"
          subtitle="Explora nuestra colección completa de joyería artesanal"
          actionLabel="Ver todas"
          actionHref="/categories"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {MOCK_CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}
