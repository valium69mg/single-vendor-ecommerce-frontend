import { ShoppingBag } from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";
import { useTranslation } from "react-i18next";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/cart/CartDrawer";

export default function NavbarCart() {
  const { t } = useTranslation();
  const { totalItems, openDrawer } = useCart();

  return (
    <>
      <button
        type="button"
        aria-label={t("cart.openCart")}
        onClick={openDrawer}
        className="relative flex h-9 w-9 items-center justify-center text-stone-700 transition-colors hover:text-amber-700"
      >
        <ShoppingBag size={ICON.md} aria-hidden />
        {totalItems > 0 && (
          <span
            data-testid="cart-badge"
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-none bg-amber-700 px-1 text-[10px] font-semibold text-white"
          >
            {totalItems}
          </span>
        )}
      </button>
      <CartDrawer />
    </>
  );
}
