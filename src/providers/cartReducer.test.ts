import { describe, it, expect } from "vitest";
import {
  cartReducer,
  emptyCartState,
  mapCartResponse,
  subtotal,
  totalItems,
} from "./cartReducer";
import type { CartLine, CartState } from "./cartReducer";
import type { CartResponse } from "@/api/api";

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    cartItemId: null,
    productVariantId: 1,
    productId: "p1",
    productName: "Ring",
    sku: "R-1",
    imageUrl: null,
    unitPrice: 100,
    discountPrice: null,
    quantity: 1,
    availableStock: 10,
    ...overrides,
  };
}

function stateWith(items: CartLine[], cartId: number | null = null): CartState {
  return { cartId, items };
}

describe("cartReducer", () => {
  it("ADD appends a new line for an unseen variant", () => {
    const next = cartReducer(emptyCartState, {
      type: "ADD",
      payload: line({ quantity: 2 }),
    });

    expect(next.items).toHaveLength(1);
    expect(next.items[0].productVariantId).toBe(1);
    expect(next.items[0].quantity).toBe(2);
  });

  it("ADD merges the quantity for the same productVariantId instead of duplicating", () => {
    const next = cartReducer(stateWith([line({ quantity: 2 })]), {
      type: "ADD",
      payload: line({ quantity: 3 }),
    });

    expect(next.items).toHaveLength(1);
    expect(next.items[0].quantity).toBe(5);
  });

  it("ADD clamps the merged quantity to availableStock", () => {
    const next = cartReducer(
      stateWith([line({ quantity: 8, availableStock: 10 })]),
      { type: "ADD", payload: line({ quantity: 5, availableStock: 10 }) },
    );

    expect(next.items[0].quantity).toBe(10);
  });

  it("ADD clamps a new line's quantity to availableStock", () => {
    const next = cartReducer(emptyCartState, {
      type: "ADD",
      payload: line({ quantity: 99, availableStock: 3 }),
    });

    expect(next.items[0].quantity).toBe(3);
  });

  it("UPDATE_QTY sets the quantity of the matching line", () => {
    const next = cartReducer(stateWith([line({ quantity: 2 })]), {
      type: "UPDATE_QTY",
      payload: { productVariantId: 1, quantity: 6 },
    });

    expect(next.items[0].quantity).toBe(6);
  });

  it("UPDATE_QTY clamps the quantity to availableStock", () => {
    const next = cartReducer(
      stateWith([line({ quantity: 2, availableStock: 5 })]),
      { type: "UPDATE_QTY", payload: { productVariantId: 1, quantity: 99 } },
    );

    expect(next.items[0].quantity).toBe(5);
  });

  it("REMOVE drops the matching line and keeps the rest", () => {
    const next = cartReducer(
      stateWith([line({ productVariantId: 1 }), line({ productVariantId: 2 })]),
      { type: "REMOVE", payload: { productVariantId: 1 } },
    );

    expect(next.items.map((i) => i.productVariantId)).toEqual([2]);
  });

  it("CLEAR empties the cart", () => {
    const next = cartReducer(
      stateWith([line(), line({ productVariantId: 2 })], 3),
      { type: "CLEAR" },
    );

    expect(next.items).toEqual([]);
  });

  it("HYDRATE replaces the whole state from a mapped server payload", () => {
    const server: CartResponse = {
      cartId: 9,
      items: [
        {
          cartItemId: 1,
          productVariantId: 4,
          productId: "p4",
          productName: "Cuff",
          sku: "C-4",
          imageUrl: null,
          unitPrice: 30,
          discountPrice: null,
          quantity: 2,
          availableStock: 6,
          lineTotal: 60,
        },
      ],
      subtotal: 60,
      totalItems: 2,
    };

    const next = cartReducer(stateWith([line()]), {
      type: "HYDRATE",
      payload: mapCartResponse(server),
    });

    expect(next.cartId).toBe(9);
    expect(next.items).toHaveLength(1);
    expect(next.items[0].productName).toBe("Cuff");
    expect(next.items[0].cartItemId).toBe(1);
  });
});

describe("cart selectors", () => {
  it("subtotal sums unitPrice * quantity across every line", () => {
    const items = [
      line({ unitPrice: 100, quantity: 2 }),
      line({ productVariantId: 2, unitPrice: 50, quantity: 3 }),
    ];

    expect(subtotal(items)).toBe(350);
  });

  it("totalItems sums the quantity across every line", () => {
    const items = [
      line({ quantity: 2 }),
      line({ productVariantId: 2, quantity: 3 }),
    ];

    expect(totalItems(items)).toBe(5);
  });

  it("selectors return zero for an empty cart", () => {
    expect(subtotal([])).toBe(0);
    expect(totalItems([])).toBe(0);
  });
});
