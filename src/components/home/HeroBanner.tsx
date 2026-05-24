import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-stone-950 min-h-[80vh] flex items-center">
      {/* Atmospheric background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-950 to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-amber-950/30 via-transparent to-stone-900/20" />
      {/* Warm ambient glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-800/10 blur-[120px] pointer-events-none" />

      {/* Decorative rings — evoking jewelry */}
      <div className="absolute top-10 right-10 w-64 h-64 rounded-full border border-amber-700/15 pointer-events-none" />
      <div className="absolute top-16 right-16 w-48 h-48 rounded-full border border-amber-600/10 pointer-events-none" />
      <div className="absolute bottom-12 right-8 w-32 h-32 rounded-full border border-stone-600/20 pointer-events-none" />
      <div className="absolute -bottom-8 left-1/3 w-80 h-80 rounded-full border border-stone-700/10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="font-store-body text-amber-400 text-xs font-medium tracking-[0.25em] uppercase">
              Joyería artesanal premium
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-store-heading text-6xl sm:text-7xl lg:text-8xl font-semibold text-white leading-[0.92] mb-6">
            Descubre la
            <br />
            <span className="italic text-amber-300">Elegancia</span>
          </h1>

          {/* Subtitle */}
          <p className="font-store-body text-stone-300 text-base sm:text-lg font-light leading-relaxed mb-10 max-w-lg">
            Piezas únicas elaboradas a mano con los mejores materiales. Joyas
            que cuentan tu historia y perduran generaciones.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-store-body font-medium px-8 py-3.5 text-sm tracking-wide transition-colors duration-200"
            >
              Explorar Colección
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 border border-stone-600 text-stone-200 hover:bg-stone-800/50 hover:border-stone-500 font-store-body font-medium px-8 py-3.5 text-sm tracking-wide transition-colors duration-200"
            >
              Ver Categorías
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
