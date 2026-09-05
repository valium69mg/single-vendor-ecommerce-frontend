import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { CartLine } from "@/providers/cartReducer";
import type { CartContextValue } from "@/context/CartContext";
import { useCart } from "@/hooks/useCart";
import CartPage from "./CartPage";

vi.mock("@/hooks/useCart", () => ({ useCart: vi.fn() }));
vi.mock("@/components/navbar/Navbar", () => ({ default: () => null }));

const mockedUseCart = vi.mocked(useCart);

function makeLine(overrides: Partial<CartLine>): CartLine {
  return {
    cartItemId: 1,
    productVariantId: 1,
    productId: "p",
    productName: "Item",
    sku: "SKU",
    imageUrl: null,
    unitPrice: 100,
    discountPrice: null,
    quantity: 1,
    availableStock: 10,
    ...overrides,
  };
}

function setCart(value: Partial<CartContextValue>) {
  mockedUseCart.mockReturnValue({
    items: [],
    subtotal: 0,
    totalItems: 0,
    isLoading: false,
    error: null,
    isDrawerOpen: false,
    openDrawer: vi.fn(),
    closeDrawer: vi.fn(),
    addItem: vi.fn(),
    updateQty: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    ...value,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<CartPage />} />
        <Route path="/checkout" element={<div>checkout page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("CartPage", () => {
  it("renders each line with its per-line total and the summary subtotal", () => {
    setCart({
      items: [
        makeLine({ productVariantId: 1, productName: "Anillo", quantity: 2, unitPrice: 100 }),
        makeLine({ productVariantId: 2, productName: "Collar", quantity: 1, unitPrice: 300 }),
      ],
      subtotal: 500,
      totalItems: 3,
    });
    renderPage();

    expect(screen.getByText("Anillo")).toBeInTheDocument();
    expect(screen.getByText("Collar")).toBeInTheDocument();
    // per-line total for the first line (2 x 100)
    expect(screen.getByText("$200.00")).toBeInTheDocument();
    // summary subtotal
    expect(screen.getByTestId("cart-summary-subtotal")).toHaveTextContent(
      "$500.00",
    );
  });

  it("shows the empty-cart message when there are no items", () => {
    setCart({ items: [], subtotal: 0, totalItems: 0 });
    renderPage();

    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
    expect(
      screen.queryByTestId("cart-summary-subtotal"),
    ).not.toBeInTheDocument();
  });

  it("calls updateQty with the next quantity when a stepper is increased", () => {
    const updateQty = vi.fn();
    setCart({
      items: [makeLine({ productVariantId: 5, quantity: 2, availableStock: 9 })],
      subtotal: 200,
      totalItems: 2,
      updateQty,
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    expect(updateQty).toHaveBeenCalledWith(5, 3);
  });

  it("calls removeItem when a line is removed", () => {
    const removeItem = vi.fn();
    setCart({
      items: [makeLine({ productVariantId: 5, productName: "Anillo" })],
      subtotal: 100,
      totalItems: 1,
      removeItem,
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(removeItem).toHaveBeenCalledWith(5);
  });

  it("navigates to /checkout when 'Finalizar compra' is clicked with a non-empty cart", () => {
    setCart({
      items: [makeLine({ productVariantId: 5 })],
      subtotal: 100,
      totalItems: 1,
    });
    renderPage();

    const cta = screen.getByRole("button", { name: "Finalizar compra" });
    expect(cta).not.toBeDisabled();
    fireEvent.click(cta);

    expect(screen.getByText("checkout page")).toBeInTheDocument();
  });
});
