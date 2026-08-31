import type { CartResponse } from "@/api/api";

/**
 * A single cart line. For guests it lives only in `localStorage`; for an
 * authenticated user it mirrors a `CartItemResponse` row (with `cartItemId`
 * populated so mutations can address the server line).
 */
export interface CartLine {
  cartItemId: number | null;
  productVariantId: number;
  productId: string | null;
  productName: string;
  sku: string | null;
  imageUrl: string | null;
  unitPrice: number;
  discountPrice: number | null;
  quantity: number;
  availableStock: number;
}

export interface CartState {
  cartId: number | null;
  items: CartLine[];
}

/** Fields a caller must supply to add something to the cart. */
export interface CartInput {
  productVariantId: number;
  quantity: number;
  productName: string;
  unitPrice: number;
  availableStock: number;
  productId?: string | null;
  sku?: string | null;
  imageUrl?: string | null;
  discountPrice?: number | null;
}

export const emptyCartState: CartState = { cartId: null, items: [] };

export type CartAction =
  | { type: "HYDRATE"; payload: CartState }
  | { type: "ADD"; payload: CartLine }
  | { type: "UPDATE_QTY"; payload: { productVariantId: number; quantity: number } }
  | { type: "REMOVE"; payload: { productVariantId: number } }
  | { type: "CLEAR" };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;

    case "ADD": {
      const incoming = action.payload;
      const existing = state.items.find(
        (item) => item.productVariantId === incoming.productVariantId,
      );

      if (existing) {
        const merged = clamp(
          existing.quantity + incoming.quantity,
          1,
          incoming.availableStock,
        );
        return {
          ...state,
          items: state.items.map((item) =>
            item.productVariantId === incoming.productVariantId
              ? { ...item, quantity: merged }
              : item,
          ),
        };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            ...incoming,
            quantity: clamp(incoming.quantity, 1, incoming.availableStock),
          },
        ],
      };
    }

    case "UPDATE_QTY": {
      const { productVariantId, quantity } = action.payload;
      return {
        ...state,
        items: state.items.map((item) =>
          item.productVariantId === productVariantId
            ? { ...item, quantity: clamp(quantity, 1, item.availableStock) }
            : item,
        ),
      };
    }

    case "REMOVE":
      return {
        ...state,
        items: state.items.filter(
          (item) => item.productVariantId !== action.payload.productVariantId,
        ),
      };

    case "CLEAR":
      return { ...state, items: [] };

    default:
      return state;
  }
}

export function subtotal(items: CartLine[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function totalItems(items: CartLine[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Normalise a server `CartResponse` into the reducer's `CartState` shape. */
export function mapCartResponse(response: CartResponse): CartState {
  return {
    cartId: response.cartId,
    items: response.items.map((item) => ({
      cartItemId: item.cartItemId,
      productVariantId: item.productVariantId,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      imageUrl: item.imageUrl,
      unitPrice: item.unitPrice,
      discountPrice: item.discountPrice,
      quantity: item.quantity,
      availableStock: item.availableStock,
    })),
  };
}
