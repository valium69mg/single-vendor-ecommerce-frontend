import Navbar from "@/components/navbar/Navbar";
import HeroBanner from "@/components/home/HeroBanner";
import TrustBar from "@/components/home/TrustBar";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import NewArrivalsSection from "@/components/home/NewArrivalsSection";
import BestSellersSection from "@/components/home/BestSellersSection";
import BenefitsSection from "@/components/home/BenefitsSection";
import HomeFooter from "@/components/home/HomeFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1">
        <HeroBanner />
        <TrustBar />
        <FeaturedCategories />
        <FeaturedProductsSection />
        <NewArrivalsSection />
        <BestSellersSection />
        <BenefitsSection />
      </main>
      <HomeFooter />
    </div>
  );
}
