import Navbar from "@/components/navbar/Navbar";
import HeroBanner from "@/components/home/HeroBanner";
import TrustBar from "@/components/home/TrustBar";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import ProductSection from "@/components/home/ProductSection";
import BenefitsSection from "@/components/home/BenefitsSection";
import HomeFooter from "@/components/home/HomeFooter";
import {
  MOCK_FEATURED_PRODUCTS,
  MOCK_NEW_ARRIVALS,
  MOCK_BESTSELLERS,
} from "@/mocks/home";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1">
        <HeroBanner />
        <TrustBar />
        <FeaturedCategories />
        <ProductSection
          title="Productos Destacados"
          subtitle="Selección especial de nuestras mejores piezas"
          products={MOCK_FEATURED_PRODUCTS}
          actionLabel="Ver todos"
          actionHref="/products"
          className="bg-white"
        />
        <ProductSection
          title="Nuevas Llegadas"
          subtitle="Las últimas incorporaciones a nuestra colección"
          products={MOCK_NEW_ARRIVALS}
          actionLabel="Ver nuevos"
          actionHref="/products?filter=new"
          className="bg-stone-50"
        />
        <ProductSection
          title="Más Vendidos"
          subtitle="Los favoritos de nuestros clientes"
          products={MOCK_BESTSELLERS}
          actionLabel="Ver más"
          actionHref="/products?filter=bestseller"
          className="bg-white"
        />
        <BenefitsSection />
      </main>
      <HomeFooter />
    </div>
  );
}
