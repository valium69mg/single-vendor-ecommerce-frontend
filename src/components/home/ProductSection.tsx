import SectionHeader from "./SectionHeader";
import ProductCard from "./ProductCard";
import type { MockProduct } from "@/mocks/home";

interface Props {
  title: string;
  subtitle?: string;
  products: MockProduct[];
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export default function ProductSection({
  title,
  subtitle,
  products,
  actionLabel,
  actionHref,
  className,
}: Props) {
  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          actionLabel={actionLabel}
          actionHref={actionHref}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
