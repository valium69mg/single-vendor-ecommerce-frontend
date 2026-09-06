import { Link } from "react-router-dom";
import { FacebookLogo, InstagramLogo, XLogo } from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";

const COLLECTIONS = [
  { label: "Anillos", href: "/products/rings" },
  { label: "Collares", href: "/products/necklaces" },
  { label: "Aretes", href: "/products/earrings" },
  { label: "Pulseras", href: "/products/bracelets" },
  { label: "Todos los productos", href: "/products" },
];

const COMPANY = [
  { label: "Nosotros", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Contacto", href: "#" },
  { label: "Política de privacidad", href: "#" },
  { label: "Términos y condiciones", href: "#" },
];

const SOCIAL = [
  { icon: InstagramLogo, label: "Instagram", href: "#" },
  { icon: FacebookLogo, label: "Facebook", href: "#" },
  { icon: XLogo, label: "Twitter / X", href: "#" },
];

export default function HomeFooter() {
  return (
    <footer className="bg-stone-950 text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 bg-amber-700 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm font-store-heading">
                  J
                </span>
              </div>
              <span className="font-store-heading text-xl font-semibold text-white">
                Joyería
              </span>
            </div>
            <p className="font-store-body text-sm leading-relaxed max-w-xs mb-6">
              Joyería artesanal premium para momentos únicos. Cada pieza es una
              obra de arte creada con amor y precisión.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-9 w-9 border border-stone-700 flex items-center justify-center hover:border-amber-700 hover:text-amber-400 transition-colors duration-200"
                >
                  <Icon size={ICON.sm} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Colecciones */}
          <div>
            <h4 className="font-store-body text-xs font-semibold text-white uppercase tracking-[0.15em] mb-4">
              Colecciones
            </h4>
            <ul className="space-y-2.5">
              {COLLECTIONS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="font-store-body text-sm hover:text-amber-400 transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-store-body text-xs font-semibold text-white uppercase tracking-[0.15em] mb-4">
              Empresa
            </h4>
            <ul className="space-y-2.5">
              {COMPANY.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="font-store-body text-sm hover:text-amber-400 transition-colors duration-150"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-store-body text-xs">
            © 2026 Joyería. Todos los derechos reservados.
          </p>
          <p className="font-store-body text-xs">
            Hecho en <span className="text-white font-medium">México</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
