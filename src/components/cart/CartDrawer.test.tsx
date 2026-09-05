import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { CartLine } from "@/providers/cartReducer";
import type { CartContextValue } from "@/context/CartContext";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "./CartDrawer";

vi.mock("@/hooks/useCart", () => ({ useCart: vi.fn() }));

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
    isDrawerOpen: true,
    openDrawer: vi.fn(),
    closeDrawer: vi.fn(),
    addItem: vi.fn(),
    updateQty: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    ...value,
  });
}

function renderDrawer() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<CartDrawer />} />
        <Route path="/checkout" element={<div>checkout page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("CartDrawer", () => {
  it("renders a row per item, the total item count and the subtotal", () => {
    setCart({
      items: [
        makeLine({ productVariantId: 1, productName: "Anillo", quantity: 2 }),
        makeLine({ productVariantId: 2, productName: "Collar", quantity: 1 }),
      ],
      subtotal: 300,
      totalItems: 3,
    });
    renderDrawer();

    expect(screen.getByText("Anillo")).toBeInTheDocument();
    expect(screen.getByText("Collar")).toBeInTheDocument();
    expect(screen.getByText("$300.00")).toBeInTheDocument();
    expect(screen.getByTestId("cart-drawer-count")).toHaveTextContent("3");
  });

  it("shows the empty message and no subtotal when the cart is empty", () => {
    setCart({ items: [], subtotal: 0, totalItems: 0 });
    renderDrawer();

    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
    expect(screen.queryByText("Subtotal")).not.toBeInTheDocument();
  });

  it("calls removeItem with the variant id when a row remove is clicked", () => {
    const removeItem = vi.fn();
    setCart({
      items: [makeLine({ productVariantId: 7, productName: "Anillo" })],
      subtotal: 100,
      totalItems: 1,
      removeItem,
    });
    renderDrawer();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(removeItem).toHaveBeenCalledWith(7);
  });

  it("calls updateQty when a row quantity is incremented", () => {
    const updateQty = vi.fn();
    setCart({
      items: [
        makeLine({ productVariantId: 7, quantity: 2, availableStock: 10 }),
      ],
      subtotal: 200,
      totalItems: 2,
      updateQty,
    });
    renderDrawer();

    fireEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    expect(updateQty).toHaveBeenCalledWith(7, 3);
  });

  it("links to the full cart page", () => {
    setCart({
      items: [makeLine({})],
      subtotal: 100,
      totalItems: 1,
    });
    renderDrawer();

    const link = screen.getByRole("link", { name: "Ver carrito" });
    expect(link).toHaveAttribute("href", "/carrito");
  });

  it("shows the cart error when one is present", () => {
    setCart({
      items: [makeLine({})],
      subtotal: 100,
      totalItems: 1,
      error: "cart_stock_exceeded",
    });
    renderDrawer();

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("closes the drawer and navigates to /checkout when 'Finalizar compra' is clicked", () => {
    const closeDrawer = vi.fn();
    setCart({
      items: [makeLine({})],
      subtotal: 100,
      totalItems: 1,
      closeDrawer,
    });
    renderDrawer();

    const cta = screen.getByRole("button", { name: "Finalizar compra" });
    expect(cta).not.toBeDisabled();
    fireEvent.click(cta);

    expect(closeDrawer).toHaveBeenCalled();
    expect(screen.getByText("checkout page")).toBeInTheDocument();
  });
});
