import { Link } from "react-router-dom";
import { Star } from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { MockProduct } from "@/mocks/home";

interface Props {
  product: MockProduct;
}

const MXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
});

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(rating);
        return (
          <Star
            key={n}
            size={ICON.sm}
            weight={filled ? "fill" : "regular"}
            className={cn(filled ? "text-amber-400" : "text-stone-200")}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

export default function ProductCard({ product }: Props) {
  const badgeColor =
    product.badge === "Nuevo"
      ? "bg-stone-900 text-white"
      : product.badge === "Agotado"
        ? "bg-stone-400 text-white"
        : "bg-amber-700 text-white";

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
      aria-label={`Ver ${product.name}`}
    >
      {/* Image area */}
      <div className="relative overflow-hidden rounded-sm aspect-square mb-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "h-full w-full bg-gradient-to-br transition-transform duration-500 group-hover:scale-105",
              product.gradient,
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-25">
              <div className="w-16 h-16 rounded-full border-2 border-stone-500" />
              <div className="absolute w-9 h-9 rounded-full border border-stone-500" />
            </div>
          </div>
        )}

        {/* Badge */}
        {product.badge && (
          <span
            className={cn(
              "absolute top-2 left-2 px-2 py-0.5 text-[10px] font-store-body font-semibold tracking-wider uppercase",
              badgeColor,
            )}
          >
            {product.badge}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-all duration-300 flex items-end justify-center pb-4">
          <span className="bg-white text-stone-900 font-store-body text-xs font-semibold px-5 py-2 tracking-wide opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250">
            Ver producto
          </span>
        </div>
      </div>

      {/* Info */}
      <div>
        <p className="font-store-body text-[11px] text-stone-400 uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 className="font-store-body text-sm font-medium text-stone-900 group-hover:text-amber-800 transition-colors duration-200 leading-snug mb-1.5">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={product.rating} />
          <span className="font-store-body text-[11px] text-stone-400">
            ({product.reviewCount})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-store-body text-sm font-semibold text-stone-900">
            {MXN.format(product.discountPrice ?? product.price)}
          </span>
          {product.discountPrice && (
            <span className="font-store-body text-xs text-stone-400 line-through">
              {MXN.format(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
