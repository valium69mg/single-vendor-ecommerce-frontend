import { createContext } from "react";
import type { CartInput, CartLine } from "@/providers/cartReducer";

export interface CartContextValue {
  items: CartLine[];
  subtotal: number;
  totalItems: number;
  isLoading: boolean;
  /** Last user-visible cart error (e.g. an over-stock rejection), or null. */
  error: string | null;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: CartInput) => Promise<void>;
  updateQty: (productVariantId: number, quantity: number) => Promise<void>;
  removeItem: (productVariantId: number) => Promise<void>;
  clear: () => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);
