import type { TFunction } from "i18next";

/**
 * Map a cart error — either a backend i18n key or a raw `Error.message` — to a
 * user-facing string. Known backend keys get a translated message; anything
 * else falls back to the raw text so failures are never silent.
 */
export function cartErrorMessage(error: string, t: TFunction): string {
  if (error === "cart_stock_exceeded" || error === "cart_quantity_invalid") {
    return t("cart.stockExceeded");
  }
  return error;
}
