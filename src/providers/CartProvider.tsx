import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CartContext } from "@/context/CartContext";
import type { CartContextValue } from "@/context/CartContext";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/useToast";
import { handleUnauthorized } from "@/lib/authHandler";
import { API_ERRORS } from "@/constants/apiErrors";
import {
  addCartItem,
  getCart,
  mergeCart,
  removeCartItem,
  updateCartItem,
} from "@/api/api";
import {
  cartReducer,
  emptyCartState,
  mapCartResponse,
  subtotal as selectSubtotal,
  totalItems as selectTotalItems,
} from "@/providers/cartReducer";
import type { CartInput, CartState } from "@/providers/cartReducer";

const STORAGE_KEY = "cart";

function readGuestCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCartState;
    const parsed = JSON.parse(raw) as Partial<CartState> | null;
    if (!parsed || !Array.isArray(parsed.items)) return emptyCartState;
    return { cartId: parsed.cartId ?? null, items: parsed.items };
  } catch {
    return emptyCartState;
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "cart_error";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useUser();
  const token = user?.token ?? null;
  const { t } = useTranslation();
  const { info } = useToast();

  const [state, dispatch] = useReducer(cartReducer, undefined, readGuestCart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Seeded with the token present at mount so an already-authenticated page
  // reload is never mistaken for a null -> token login transition (R7).
  const previousTokenRef = useRef<string | null>(token);

  // Persist the guest cart only. While authenticated we never write to the
  // guest key, so a guest cart built before login survives it untouched
  // (server reconciliation is a future change).
  useEffect(() => {
    if (token) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, token]);

  // Reflect the server cart whenever we have an authenticated user; fall back
  // to the stored guest cart otherwise (e.g. after logout). On a genuine
  // null -> token transition with a non-empty guest cart, merge it into the
  // server cart instead of fetching (R7/R8/R9) — folded into this same effect
  // (rather than a sibling effect) so a GET /cart never races a POST
  // /cart/merge over the same HYDRATE dispatch.
  useEffect(() => {
    const previousToken = previousTokenRef.current;
    // Flip immediately (before the async call): a merge is attempted at most
    // once per transition, even if it fails. Rolled back below if this exact
    // invocation is aborted before settling (StrictMode dev double-invoke).
    previousTokenRef.current = token;

    if (!token) {
      dispatch({ type: "HYDRATE", payload: readGuestCart() });
      return;
    }

    const guestCart = readGuestCart();
    const shouldMerge = previousToken === null && guestCart.items.length > 0;

    let cancelled = false;
    let settled = false;

    const hydrateFromServer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Yield one microtask before doing any real network work. A
        // StrictMode-simulated synchronous double-invoke (mount -> cleanup ->
        // mount) cancels the first invocation here, before it ever calls the
        // API — so merge/get is attempted exactly once despite the double
        // effect run.
        await Promise.resolve();
        if (cancelled) return;

        if (shouldMerge) {
          const result = await mergeCart(
            guestCart.items.map((item) => ({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
            })),
            token,
          );
          if (cancelled) return;
          localStorage.removeItem(STORAGE_KEY); // clear ONLY on success
          dispatch({ type: "HYDRATE", payload: mapCartResponse(result.cart) });
          if (result.adjustedLines.length > 0) {
            info(t("cart.merged.adjusted", { count: result.adjustedLines.length }));
          }
          if (result.skippedLines.length > 0) {
            info(t("cart.merged.skipped", { count: result.skippedLines.length }));
          }
        } else {
          const response = await getCart(token);
          if (!cancelled) {
            dispatch({ type: "HYDRATE", payload: mapCartResponse(response) });
          }
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && err.message === API_ERRORS.UNAUTHORIZED) {
          handleUnauthorized(logout);
        } else if (!shouldMerge) {
          setError(toErrorMessage(err));
        }
        // shouldMerge branch: swallow silently. localStorage["cart"] stays
        // untouched; no error state, no toast, no retry — login still
        // succeeds and the in-memory cart stays whatever it was pre-transition.
      } finally {
        settled = true;
        if (!cancelled) setIsLoading(false);
      }
    };

    void hydrateFromServer();

    return () => {
      cancelled = true;
      if (!settled) {
        previousTokenRef.current = previousToken;
      }
    };
  }, [token, logout, t, info]);

  const addItem = useCallback(
    async (input: CartInput) => {
      setError(null);

      if (!token) {
        dispatch({
          type: "ADD",
          payload: {
            cartItemId: null,
            productVariantId: input.productVariantId,
            productId: input.productId ?? null,
            productName: input.productName,
            sku: input.sku ?? null,
            imageUrl: input.imageUrl ?? null,
            unitPrice: input.unitPrice,
            discountPrice: input.discountPrice ?? null,
            quantity: input.quantity,
            availableStock: input.availableStock,
          },
        });
        return;
      }

      try {
        const response = await addCartItem(
          { productVariantId: input.productVariantId, quantity: input.quantity },
          token,
        );
        dispatch({ type: "HYDRATE", payload: mapCartResponse(response) });
      } catch (err) {
        setError(toErrorMessage(err));
      }
    },
    [token],
  );

  const updateQty = useCallback(
    async (productVariantId: number, quantity: number) => {
      setError(null);
      const line = state.items.find(
        (item) => item.productVariantId === productVariantId,
      );

      if (!token || !line?.cartItemId) {
        dispatch({ type: "UPDATE_QTY", payload: { productVariantId, quantity } });
        return;
      }

      try {
        const response = await updateCartItem(
          line.cartItemId,
          { quantity },
          token,
        );
        dispatch({ type: "HYDRATE", payload: mapCartResponse(response) });
      } catch (err) {
        setError(toErrorMessage(err));
      }
    },
    [token, state.items],
  );

  const removeItem = useCallback(
    async (productVariantId: number) => {
      setError(null);
      const line = state.items.find(
        (item) => item.productVariantId === productVariantId,
      );

      if (!token || !line?.cartItemId) {
        dispatch({ type: "REMOVE", payload: { productVariantId } });
        return;
      }

      try {
        const response = await removeCartItem(line.cartItemId, token);
        dispatch({ type: "HYDRATE", payload: mapCartResponse(response) });
      } catch (err) {
        setError(toErrorMessage(err));
      }
    },
    [token, state.items],
  );

  const clear = useCallback(() => {
    setError(null);
    dispatch({ type: "CLEAR" });
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      subtotal: selectSubtotal(state.items),
      totalItems: selectTotalItems(state.items),
      isLoading,
      error,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      addItem,
      updateQty,
      removeItem,
      clear,
    }),
    [
      state.items,
      isLoading,
      error,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      addItem,
      updateQty,
      removeItem,
      clear,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
