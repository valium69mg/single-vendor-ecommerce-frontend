import { Package } from "lucide-react";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-store-heading text-3xl font-semibold text-stone-900">
        Productos
      </h1>
      <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-stone-300 rounded-none bg-white">
        <div className="h-14 w-14 bg-stone-100 flex items-center justify-center mb-4">
          <Package className="h-6 w-6 text-stone-400" />
        </div>
        <p className="font-store-heading text-xl font-semibold text-stone-900 mb-1">
          Próximamente
        </p>
        <p className="font-store-body text-sm text-stone-500">
          La gestión de productos estará disponible en breve.
        </p>
      </div>
    </div>
  );
}
