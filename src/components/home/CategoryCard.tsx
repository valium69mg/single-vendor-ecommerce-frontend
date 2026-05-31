import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { gradients } from "@/mocks/home";
import type { PublicCategory } from "@/api/api";
import ImageWithFallback from "../common/ImageWithFallback";
import { API_FILE_URL } from "@/api/api";

interface Props {
  category: PublicCategory;
}

const CATEGORIES_PRODUCTS_TO_SHOW_THRESHOLD = 500;

function getSanitizedCategoriesProducts(products: number): string {
  if (products > CATEGORIES_PRODUCTS_TO_SHOW_THRESHOLD) {
    return String(CATEGORIES_PRODUCTS_TO_SHOW_THRESHOLD) + "+";
  }
  return String(products);
}

export default function CategoryCard({ category }: Props) {
  const gradient = gradients[Math.floor(Math.random() * gradients.length)];

  return (
    <Link
      to={`/category/${category.categoryId}`}
      className="group block"
      aria-label={`Ver categoría ${category.name}`}
    >
      {/* Image / gradient area */}
      <div className="relative overflow-hidden rounded-sm aspect-square mb-3">
        {category.imageUrl ? (
          <ImageWithFallback
            src={API_FILE_URL + category.imageUrl}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "h-full w-full bg-gradient-to-br transition-transform duration-500 group-hover:scale-105",
              gradient,
            )}
          >
            {/* Decorative jewelry-ring placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-stone-400/30" />
              <div className="absolute w-12 h-12 rounded-full border border-stone-400/20" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/8 transition-colors duration-300" />
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="font-store-heading text-xl font-semibold text-stone-900 group-hover:text-amber-800 transition-colors duration-200">
          {category.name}
        </h3>
        <p className="font-store-body text-xs text-stone-400 mt-0.5">
          {getSanitizedCategoriesProducts(category.products)} productos
        </p>
      </div>
    </Link>
  );
}
