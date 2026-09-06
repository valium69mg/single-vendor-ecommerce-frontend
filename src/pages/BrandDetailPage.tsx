import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar/Navbar";
import PublicProductCard from "@/components/home/PublicProductCard";
import { Spinner } from "@/components/ui/spinner";
import { getBrandBySlug, getProducts } from "@/api/api";
import NotFoundPage from "./NotFoundPage";

const PAGE_SIZE = 24;

export default function BrandDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    data: brand,
    isLoading: isBrandLoading,
    isError,
  } = useQuery({
    queryKey: ["brand", "by-slug", slug],
    queryFn: () => getBrandBySlug(slug),
    enabled: Boolean(slug),
    retry: false,
  });

  // Reconcile the browser URL when the slug in the address bar is stale: the
  // backend 301 is followed transparently by `fetch`, so the canonical slug only
  // shows up in the response DTO.
  useEffect(() => {
    if (brand && brand.slug && brand.slug !== slug) {
      navigate(`/brand/${brand.slug}`, { replace: true });
    }
  }, [brand, slug, navigate]);

  const { data: products, isLoading: areProductsLoading } = useQuery({
    queryKey: ["products", "by-brand", brand?.brandId],
    queryFn: () =>
      getProducts(0, PAGE_SIZE, undefined, undefined, {
        brandId: brand!.brandId,
      }),
    enabled: Boolean(brand),
  });

  if (isError) {
    return <NotFoundPage />;
  }

  const isLoading = isBrandLoading || !brand;

  return (
    <div className="flex min-h-dvh flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <>
            <h1 className="font-store-heading text-3xl text-stone-900">
              {brand.name}
            </h1>

            <div className="mt-8">
              {areProductsLoading ? (
                <div className="flex justify-center py-20">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (products?.content ?? []).length === 0 ? (
                <p className="font-store-body text-sm text-stone-500">
                  {t("brandPage.empty")}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                  {(products?.content ?? []).map((product) => (
                    <PublicProductCard
                      key={product.productId}
                      product={product}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
