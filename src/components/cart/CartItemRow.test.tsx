import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { CartLine } from "@/providers/cartReducer";
import { CartItemRow } from "./CartItemRow";

const line: CartLine = {
  cartItemId: 1,
  productVariantId: 42,
  productId: "p1",
  productName: "Anillo de plata",
  sku: "AG-001",
  imageUrl: null,
  unitPrice: 250,
  discountPrice: null,
  quantity: 2,
  availableStock: 10,
};

describe("CartItemRow", () => {
  it("renders the product name, sku, unit price and line total", () => {
    render(
      <CartItemRow line={line} onQtyChange={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(screen.getByText("Anillo de plata")).toBeInTheDocument();
    expect(screen.getByText("AG-001")).toBeInTheDocument();
    expect(screen.getByText("$250.00")).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();
  });

  it("calls onRemove when the remove control is clicked", () => {
    const onRemove = vi.fn();
    render(
      <CartItemRow line={line} onQtyChange={vi.fn()} onRemove={onRemove} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("calls onQtyChange when the stepper increments", () => {
    const onQtyChange = vi.fn();
    render(
      <CartItemRow line={line} onQtyChange={onQtyChange} onRemove={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    expect(onQtyChange).toHaveBeenCalledWith(3);
  });
});
