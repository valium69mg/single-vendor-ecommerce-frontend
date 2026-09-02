import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar/Navbar";
import PublicProductCard from "@/components/home/PublicProductCard";
import { Spinner } from "@/components/ui/spinner";
import { getCategoryBySlug, getProducts } from "@/api/api";
import NotFoundPage from "./NotFoundPage";

const PAGE_SIZE = 24;

export default function CategoryDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    data: category,
    isLoading: isCategoryLoading,
    isError,
  } = useQuery({
    queryKey: ["category", "by-slug", slug],
    queryFn: () => getCategoryBySlug(slug),
    enabled: Boolean(slug),
    retry: false,
  });

  // Reconcile the browser URL when the slug in the address bar is stale: the
  // backend 301 is followed transparently by `fetch`, so the canonical slug only
  // shows up in the response DTO.
  useEffect(() => {
    if (category && category.slug && category.slug !== slug) {
      navigate(`/category/${category.slug}`, { replace: true });
    }
  }, [category, slug, navigate]);

  const { data: products, isLoading: areProductsLoading } = useQuery({
    queryKey: ["products", "by-category", category?.categoryId],
    queryFn: () =>
      getProducts(0, PAGE_SIZE, undefined, undefined, {
        categoryId: category!.categoryId,
      }),
    enabled: Boolean(category),
  });

  if (isError) {
    return <NotFoundPage />;
  }

  const isLoading = isCategoryLoading || !category;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <>
            <h1 className="font-store-heading text-3xl text-stone-900">
              {category.name}
            </h1>

            <div className="mt-8">
              {areProductsLoading ? (
                <div className="flex justify-center py-20">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (products?.content ?? []).length === 0 ? (
                <p className="font-store-body text-sm text-stone-500">
                  {t("categoryPage.empty")}
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
