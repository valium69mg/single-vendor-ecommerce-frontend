import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/api/api";
import SectionHeader from "./SectionHeader";
import PublicProductCard from "./PublicProductCard";
import { Spinner } from "../ui/spinner";

const PAGE = 0;
const SIZE = 5;

function oneWeekAgoISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export default function NewArrivalsSection() {
  const createdAtStart = oneWeekAgoISO();

  const { data, isLoading } = useQuery({
    queryKey: ["products", PAGE, SIZE, "new-arrivals"],
    queryFn: () => getProducts(PAGE, SIZE, undefined, createdAtStart),
  });

  return (
    <section className="bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader
          title="Nuevas Llegadas"
          subtitle="Las últimas incorporaciones a nuestra colección"
          actionLabel="Ver nuevos"
          actionHref="/products?filter=new"
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-5 h-5" />
          </div>
        ) : !data?.content.length ? (
          <p className="font-store-body text-sm text-stone-400 text-center py-8">
            No hay nuevas llegadas disponibles por el momento.
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
