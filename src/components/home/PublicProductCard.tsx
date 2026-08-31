import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { gradients } from "@/mocks/home";
import type { PublicProduct } from "@/api/api";
import { getFileUrl } from "@/api/api";
import { formatMXN } from "@/lib/format";

interface Props {
  product: PublicProduct;
}

export default function PublicProductCard({ product }: Props) {
  const hasDiscount = product.minDiscountPrice < product.minPrice;
  const gradient =
    gradients[product.productId.charCodeAt(0) % gradients.length];
  const imageSrc = getFileUrl(product.mediumThumbnailUrl ?? product.imageUrl);
  const hasRealImage =
    product.mediumThumbnailUrl !== null || product.imageUrl !== null;

  return (
    <Link
      to={`/product/${product.productId}`}
      className="group block"
      aria-label={`Ver ${product.name}`}
    >
      {/* Image area */}
      <div className="relative overflow-hidden rounded-sm aspect-square mb-3">
        {hasRealImage ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/images/landscape-placeholder.svg";
            }}
          />
        ) : (
          <div
            className={cn(
              "h-full w-full bg-gradient-to-br transition-transform duration-500 group-hover:scale-105",
              gradient,
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-25">
              <div className="w-16 h-16 rounded-full border-2 border-stone-500" />
              <div className="absolute w-9 h-9 rounded-full border border-stone-500" />
            </div>
          </div>
        )}

        {/* Out-of-stock badge */}
        {product.totalStock === 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-store-body font-semibold tracking-wider uppercase bg-stone-400 text-white">
            Agotado
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
        {product.category && (
          <p className="font-store-body text-[11px] text-stone-400 uppercase tracking-wider mb-1">
            {product.category.name}
          </p>
        )}
        <h3 className="font-store-body text-sm font-medium text-stone-900 group-hover:text-amber-800 transition-colors duration-200 leading-snug mb-1.5">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-store-body text-sm font-semibold text-stone-900">
            {formatMXN(hasDiscount ? product.minDiscountPrice : product.minPrice)}
          </span>
          {hasDiscount && (
            <span className="font-store-body text-xs text-stone-400 line-through">
              {formatMXN(product.minPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
