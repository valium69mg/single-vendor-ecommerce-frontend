import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/api/api";
import SectionHeader from "./SectionHeader";
import PublicProductCard from "./PublicProductCard";
import { Spinner } from "../ui/spinner";

const PAGE = 0;
const SIZE = 5;

export default function BestSellersSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["products", PAGE, SIZE, "best-sellers"],
    queryFn: () => getProducts(PAGE, SIZE),
  });

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader
          title="Más Vendidos"
          subtitle="Los favoritos de nuestros clientes"
          actionLabel="Ver más"
          actionHref="/products?filter=bestseller"
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-5 h-5" />
          </div>
        ) : !data?.content.length ? (
          <p className="font-store-body text-sm text-stone-400 text-center py-8">
            No hay productos disponibles por el momento.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
            {data.content.map((product) => (
              <PublicProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
