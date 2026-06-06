import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/api/api";
import SectionHeader from "./SectionHeader";
import PublicProductCard from "./PublicProductCard";
import { Spinner } from "../ui/spinner";

const PAGE = 0;
const SIZE = 8;

export default function FeaturedProductsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["products", PAGE, SIZE, "featured"],
    queryFn: () => getProducts(PAGE, SIZE, true),
  });

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader
          title="Productos Destacados"
          subtitle="Selección especial de nuestras mejores piezas"
          actionLabel="Ver todos"
          actionHref="/products"
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-5 h-5" />
          </div>
        ) : !data?.content.length ? (
          <p className="font-store-body text-sm text-stone-400 text-center py-8">
            No hay productos destacados disponibles por el momento.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {data.content.map((product) => (
              <PublicProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
