import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { ReactNode } from "react";
import { CartContext } from "@/context/CartContext";
import type { CartContextValue } from "@/context/CartContext";
import { useUser } from "@/hooks/useUser";
import { handleUnauthorized } from "@/lib/authHandler";
import { API_ERRORS } from "@/constants/apiErrors";
import {
  addCartItem,
  getCart,
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

  const [state, dispatch] = useReducer(cartReducer, undefined, readGuestCart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Persist the guest cart only. While authenticated we never write to the
  // guest key, so a guest cart built before login survives it untouched
  // (server reconciliation is a future change).
  useEffect(() => {
    if (token) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, token]);

  // Reflect the server cart whenever we have an authenticated user; fall back
  // to the stored guest cart otherwise (e.g. after logout).
  useEffect(() => {
    if (!token) {
      dispatch({ type: "HYDRATE", payload: readGuestCart() });
      return;
    }

    let cancelled = false;

    const hydrateFromServer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getCart(token);
        if (!cancelled) {
          dispatch({ type: "HYDRATE", payload: mapCartResponse(response) });
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && err.message === API_ERRORS.UNAUTHORIZED) {
          handleUnauthorized(logout);
        } else {
          setError(toErrorMessage(err));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void hydrateFromServer();

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

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
