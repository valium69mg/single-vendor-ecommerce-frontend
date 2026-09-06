import { Diamond, Handshake, Package, SealCheck } from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";

const BENEFITS = [
  {
    icon: Diamond,
    title: "Materiales Certificados",
    description:
      "Oro certificado, plata 925 y gemas naturales con certificación de origen garantizada.",
  },
  {
    icon: SealCheck,
    title: "Garantía Extendida",
    description:
      "2 años de garantía contra defectos de fabricación y certificado de autenticidad incluido.",
  },
  {
    icon: Package,
    title: "Envío Seguro",
    description:
      "Empaque especial de lujo y seguro de envío incluido para que tu joya llegue perfecta.",
  },
  {
    icon: Handshake,
    title: "Hecho a Mano",
    description:
      "Cada pieza es elaborada artesanalmente por joyeros con más de 20 años de experiencia.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="bg-stone-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-store-heading text-4xl sm:text-5xl font-semibold text-white mb-3">
            Por qué elegirnos
          </h2>
          <p className="font-store-body text-stone-400 text-base max-w-xl mx-auto">
            Más de 15 años creando piezas únicas que acompañan los momentos más
            especiales de tu vida.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-amber-700/20 border border-amber-700/30 flex items-center justify-center">
                <Icon size={ICON.lg} className="text-amber-400" aria-hidden />
              </div>
              <h3 className="font-store-body text-sm font-semibold text-white mb-2 tracking-wide">
                {title}
              </h3>
              <p className="font-store-body text-xs text-stone-400 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
