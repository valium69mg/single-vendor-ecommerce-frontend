import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar/Navbar";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { Spinner } from "@/components/ui/spinner";
import { getPublicProductBySlug, getFileUrl } from "@/api/api";
import type { PublicProductVariant } from "@/api/api";
import NotFoundPage from "./NotFoundPage";
import { formatMXN } from "@/lib/format";
import { useCart } from "@/hooks/useCart";

function variantLabel(variant: PublicProductVariant): string {
  const values = variant.attributeValues.map((av) => av.value).join(" / ");
  return values || `#${variant.productVariantId}`;
}

function effectivePrice(variant: PublicProductVariant): number {
  return variant.discountPrice ?? variant.price;
}

export default function ProductDetailPage() {
  const { slug = "" } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addItem, openDrawer } = useCart();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["public-product", slug],
    queryFn: () => getPublicProductBySlug(slug),
    enabled: Boolean(slug),
    retry: false,
  });

  // Reconcile the browser URL when the slug in the address bar is stale: the
  // backend 301 is followed transparently by `fetch`, so the canonical slug only
  // shows up in the response DTO.
  useEffect(() => {
    if (product && product.slug && product.slug !== slug) {
      navigate(`/product/${product.slug}`, { replace: true });
    }
  }, [product, slug, navigate]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(() => {
    if (!product || product.variants.length === 0) return null;
    return (
      product.variants.find((v) => v.productVariantId === selectedId) ??
      product.variants[0]
    );
  }, [product, selectedId]);

  const handleAdd = async () => {
    if (!product || !selectedVariant) return;
    await addItem({
      productVariantId: selectedVariant.productVariantId,
      quantity,
      productName: product.name,
      unitPrice: effectivePrice(selectedVariant),
      availableStock: selectedVariant.stock,
      productId: product.productId,
      imageUrl: product.mediumThumbnailUrl ?? product.imageUrl,
      discountPrice: selectedVariant.discountPrice,
    });
    openDrawer();
  };

  if (isError) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {isLoading || !product ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2">
            <ImageWithFallback
              src={getFileUrl(product.mediumThumbnailUrl ?? product.imageUrl)}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />

            <div className="flex flex-col gap-4">
              <h1 className="font-store-heading text-2xl text-stone-900">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="font-store-body text-sm text-stone-500">
                  {product.shortDescription}
                </p>
              )}

              {selectedVariant && (
                <p className="font-store-body text-xl font-semibold text-stone-900">
                  {formatMXN(effectivePrice(selectedVariant))}
                </p>
              )}

              <label className="font-store-body text-sm text-stone-700">
                {t("variant")}
                <select
                  className="mt-1 block w-full rounded-none border border-stone-300 bg-white px-3 py-2 text-sm"
                  value={selectedVariant?.productVariantId ?? ""}
                  onChange={(e) => {
                    setSelectedId(Number(e.target.value));
                    setQuantity(1);
                  }}
                >
                  {product.variants.map((variant) => (
                    <option
                      key={variant.productVariantId}
                      value={variant.productVariantId}
                    >
                      {variantLabel(variant)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-3">
                <span className="font-store-body text-sm text-stone-700">
                  {t("cart.quantity")}
                </span>
                <QuantityStepper
                  value={quantity}
                  max={Math.max(selectedVariant?.stock ?? 1, 1)}
                  onChange={setQuantity}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                />
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="mt-2 w-full bg-stone-900 py-3 font-store-body text-sm text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
              >
                {selectedVariant && selectedVariant.stock === 0
                  ? t("cart.outOfStock")
                  : t("cart.addToCart")}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
