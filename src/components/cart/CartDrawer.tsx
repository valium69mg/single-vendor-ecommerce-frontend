import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { formatMXN } from "@/lib/format";
import { cartErrorMessage } from "./cartError";
import { CartItemRow } from "./CartItemRow";

export function CartDrawer() {
  const { t } = useTranslation();
  const {
    items,
    subtotal,
    totalItems,
    error,
    isDrawerOpen,
    closeDrawer,
    updateQty,
    removeItem,
  } = useCart();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-store-heading">
            {t("cart.title")}{" "}
            <span data-testid="cart-drawer-count" className="text-stone-400">
              ({totalItems})
            </span>
          </SheetTitle>
        </SheetHeader>

        {error && (
          <p
            role="alert"
            className="bg-red-50 px-3 py-2 font-store-body text-xs text-red-700"
          >
            {cartErrorMessage(error, t)}
          </p>
        )}

        {items.length === 0 ? (
          <p className="flex flex-1 items-center justify-center font-store-body text-sm text-stone-400">
            {t("cart.empty")}
          </p>
        ) : (
          <>
            <div className="flex-1 divide-y divide-stone-100 overflow-y-auto">
              {items.map((line) => (
                <CartItemRow
                  key={line.productVariantId}
                  line={line}
                  onQtyChange={(quantity) =>
                    updateQty(line.productVariantId, quantity)
                  }
                  onRemove={() => removeItem(line.productVariantId)}
                />
              ))}
            </div>

            <div className="border-t border-stone-200 pt-4">
              <div className="mb-3 flex items-center justify-between font-store-body text-sm">
                <span>{t("cart.subtotal")}</span>
                <span className="font-semibold">{formatMXN(subtotal)}</span>
              </div>
              <Link
                to="/carrito"
                onClick={closeDrawer}
                className="mb-2 block w-full border border-stone-900 py-2 text-center font-store-body text-sm text-stone-900 transition-colors hover:bg-stone-100"
              >
                {t("cart.viewCart")}
              </Link>
              <button
                type="button"
                disabled
                className="w-full bg-stone-900 py-2 font-store-body text-sm text-white opacity-50"
              >
                {t("cart.checkout")}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
