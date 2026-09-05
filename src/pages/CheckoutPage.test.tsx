import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { CartContextValue } from "@/context/CartContext";
import type { CartLine } from "@/providers/cartReducer";
import { useCart } from "@/hooks/useCart";
import { useUser } from "@/hooks/useUser";
import { createOrder, CheckoutStockConflictError } from "@/api/api";
import type { LoginResponse, OrderResponse } from "@/api/api";
import CheckoutPage from "./CheckoutPage";

const navigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/hooks/useCart", () => ({ useCart: vi.fn() }));
vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/components/navbar/Navbar", () => ({ default: () => null }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, createOrder: vi.fn() };
});

const mockedUseCart = vi.mocked(useCart);
const mockedUseUser = vi.mocked(useUser);
const mockedCreateOrder = vi.mocked(createOrder);

function makeLine(overrides: Partial<CartLine>): CartLine {
  return {
    cartItemId: 1,
    productVariantId: 1,
    productId: "p",
    productName: "Anillo",
    sku: "SKU",
    imageUrl: null,
    unitPrice: 100,
    discountPrice: null,
    quantity: 2,
    availableStock: 10,
    ...overrides,
  };
}

function setCart(value: Partial<CartContextValue>) {
  mockedUseCart.mockReturnValue({
    items: [makeLine({})],
    subtotal: 200,
    totalItems: 2,
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

function setUser() {
  mockedUseUser.mockReturnValue({
    user: {
      token: "tok",
      userId: "u1",
      email: "shopper@example.com",
      name: "Shopper",
      role: "USER",
      isVerified: true,
    } as LoginResponse,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

function fillAddress() {
  fireEvent.change(screen.getByLabelText("Destinatario"), {
    target: { value: "Jane Doe" },
  });
  fireEvent.change(screen.getByLabelText("Dirección"), {
    target: { value: "Av. Reforma 123" },
  });
  fireEvent.change(screen.getByLabelText("Ciudad"), {
    target: { value: "CDMX" },
  });
  fireEvent.change(screen.getByLabelText("Estado"), {
    target: { value: "CDMX" },
  });
  fireEvent.change(screen.getByLabelText("Código postal"), {
    target: { value: "01000" },
  });
  fireEvent.change(screen.getByLabelText("País"), {
    target: { value: "MX" },
  });
  fireEvent.change(screen.getByLabelText("Teléfono"), {
    target: { value: "5555555555" },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));
}

const ORDER: OrderResponse = {
  orderId: 1,
  orderNumber: "ORD-20260101-1",
  status: "PENDING",
  subtotal: 200,
  shippingCost: 99,
  total: 299,
  shippingAddress: {
    recipient: "Jane Doe",
    line1: "Av. Reforma 123",
    city: "CDMX",
    state: "CDMX",
    postalCode: "01000",
    country: "MX",
    phone: "5555555555",
  },
  items: [],
  createdAt: "2026-01-01T00:00:00",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CheckoutPage", () => {
  it("submits a valid order and navigates to the confirmation route with justPurchased state", async () => {
    setUser();
    setCart({});
    mockedCreateOrder.mockResolvedValue(ORDER);

    render(<CheckoutPage />);
    fillAddress();
    submit();

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/pedido/ORD-20260101-1", {
        state: { justPurchased: true },
      }),
    );
  });

  it("clears the cart on successful order creation", async () => {
    setUser();
    const clear = vi.fn();
    setCart({ clear });
    mockedCreateOrder.mockResolvedValue(ORDER);

    render(<CheckoutPage />);
    fillAddress();
    submit();

    await waitFor(() => expect(clear).toHaveBeenCalled());
  });

  it("on a 409 stock conflict, clamps the offending line via updateQty, stays on the page, and allows a successful resubmit", async () => {
    setUser();
    const updateQty = vi.fn();
    setCart({
      items: [
        makeLine({ productVariantId: 7, quantity: 5, availableStock: 10 }),
      ],
      updateQty,
    });
    mockedCreateOrder
      .mockRejectedValueOnce(
        new CheckoutStockConflictError("order_stock_insufficient", [
          {
            productVariantId: 7,
            type: "STOCK_INSUFFICIENT",
            requestedQuantity: 5,
            availableStock: 2,
          },
        ]),
      )
      .mockResolvedValueOnce(ORDER);

    render(<CheckoutPage />);
    fillAddress();
    submit();

    await waitFor(() => expect(updateQty).toHaveBeenCalledWith(7, 2));
    expect(navigate).not.toHaveBeenCalled();

    submit();

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/pedido/ORD-20260101-1", {
        state: { justPurchased: true },
      }),
    );
  });

  it("on a 409 product-unavailable conflict, flags the line without redirecting and without clamping quantity", async () => {
    setUser();
    const updateQty = vi.fn();
    setCart({
      items: [
        makeLine({ productVariantId: 9, quantity: 1, availableStock: 5 }),
      ],
      updateQty,
    });
    mockedCreateOrder.mockRejectedValueOnce(
      new CheckoutStockConflictError("order_product_unavailable", [
        {
          productVariantId: 9,
          type: "PRODUCT_UNAVAILABLE",
          requestedQuantity: 1,
          availableStock: 0,
        },
      ]),
    );

    render(<CheckoutPage />);
    fillAddress();
    submit();

    await waitFor(() =>
      expect(
        screen.getByText(
          "Este producto ya no está disponible. Elimínalo del carrito para continuar.",
        ),
      ).toBeInTheDocument(),
    );
    expect(updateQty).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("shows the empty-cart message and does not render the form when the cart has no items", () => {
    setUser();
    setCart({ items: [], subtotal: 0, totalItems: 0 });

    render(<CheckoutPage />);

    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Confirmar pedido" }),
    ).not.toBeInTheDocument();
  });
});
