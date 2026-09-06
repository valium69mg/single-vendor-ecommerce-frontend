import { ArrowCounterClockwise, Lock, ShieldCheck, Truck } from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";

const TRUST_ITEMS = [
  {
    icon: Truck,
    title: "Envío a toda la República",
    subtitle: "DHL y FedEx",
  },
  {
    icon: ShieldCheck,
    title: "Garantía de autenticidad",
    subtitle: "Certificado incluido",
  },
  {
    icon: ArrowCounterClockwise,
    title: "Devoluciones en 30 días",
    subtitle: "Sin complicaciones",
  },
  {
    icon: Lock,
    title: "Pago 100% seguro",
    subtitle: "Stripe y PayPal",
  },
];

export default function TrustBar() {
  return (
    <div className="bg-white border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-stone-100">
          {TRUST_ITEMS.map(({ icon: Icon, title, subtitle }) => (
            <div
              key={title}
              className="flex items-center gap-3 py-4 px-4 sm:px-6"
            >
              <div className="shrink-0 h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Icon size={ICON.md} className="text-amber-700" aria-hidden />
              </div>
              <div>
                <p className="font-store-body text-xs font-semibold text-stone-800 leading-tight">
                  {title}
                </p>
                <p className="font-store-body text-xs text-stone-400 mt-0.5">
                  {subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
