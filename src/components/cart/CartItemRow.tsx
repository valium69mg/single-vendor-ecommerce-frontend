import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { getFileUrl } from "@/api/api";
import { formatMXN } from "@/lib/format";
import type { CartLine } from "@/providers/cartReducer";
import { QuantityStepper } from "./QuantityStepper";

interface CartItemRowProps {
  line: CartLine;
  onQtyChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemRow({ line, onQtyChange, onRemove }: CartItemRowProps) {
  const { t } = useTranslation();
  const lineTotal = line.unitPrice * line.quantity;

  return (
    <div className="flex gap-4 py-4">
      <ImageWithFallback
        src={getFileUrl(line.imageUrl)}
        alt={line.productName}
        className="h-20 w-20 flex-shrink-0 object-cover"
      />

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-store-body text-sm font-medium text-stone-900">
              {line.productName}
            </p>
            {line.sku && (
              <p className="font-store-body text-xs text-stone-400">{line.sku}</p>
            )}
          </div>
          <button
            type="button"
            aria-label={t("cart.remove")}
            className="text-stone-400 transition-colors hover:text-red-600"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <p className="font-store-body text-xs text-stone-500">
          {formatMXN(line.unitPrice)}
        </p>

        <div className="mt-1 flex items-center justify-between">
          <QuantityStepper
            value={line.quantity}
            max={line.availableStock}
            onChange={onQtyChange}
          />
          <span className="font-store-body text-sm font-semibold text-stone-900">
            {formatMXN(lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
