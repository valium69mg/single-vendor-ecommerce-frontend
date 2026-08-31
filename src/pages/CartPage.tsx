import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/navbar/Navbar";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { cartErrorMessage } from "@/components/cart/cartError";
import { useCart } from "@/hooks/useCart";
import { formatMXN } from "@/lib/format";

export default function CartPage() {
  const { t } = useTranslation();
  const { items, subtotal, error, updateQty, removeItem } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-6 font-store-heading text-2xl text-stone-900">
          {t("cart.title")}
        </h1>

        {error && (
          <p
            role="alert"
            className="mb-4 bg-red-50 px-3 py-2 font-store-body text-sm text-red-700"
          >
            {cartErrorMessage(error, t)}
          </p>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-start gap-4 py-16">
            <p className="font-store-body text-sm text-stone-400">
              {t("cart.empty")}
            </p>
            <Link
              to="/"
              className="border border-stone-900 px-5 py-2 font-store-body text-sm text-stone-900 transition-colors hover:bg-stone-100"
            >
              {t("cart.continueShopping")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
            <div className="divide-y divide-stone-100">
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

            <aside className="h-fit border border-stone-200 bg-white p-5">
              <h2 className="mb-4 font-store-heading text-lg text-stone-900">
                {t("cart.subtotal")}
              </h2>
              <div className="mb-4 flex items-center justify-between font-store-body text-sm">
                <span>{t("cart.subtotal")}</span>
                <span
                  data-testid="cart-summary-subtotal"
                  className="font-semibold"
                >
                  {formatMXN(subtotal)}
                </span>
              </div>
              <button
                type="button"
                disabled
                className="w-full bg-stone-900 py-2 font-store-body text-sm text-white opacity-50"
              >
                {t("cart.checkout")}
              </button>
              <Link
                to="/"
                className="mt-3 block text-center font-store-body text-xs text-stone-500 underline"
              >
                {t("cart.continueShopping")}
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
