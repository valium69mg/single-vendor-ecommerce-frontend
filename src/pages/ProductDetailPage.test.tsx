import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { CartContextValue } from "@/context/CartContext";
import * as api from "@/api/api";
import { useCart } from "@/hooks/useCart";
import ProductDetailPage from "./ProductDetailPage";

vi.mock("@/hooks/useCart", () => ({ useCart: vi.fn() }));
vi.mock("@/components/navbar/Navbar", () => ({ default: () => null }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, getPublicProduct: vi.fn() };
});

const mockedUseCart = vi.mocked(useCart);

const product: api.PublicProductById = {
  productId: "abc-123",
  name: "Anillo de plata",
  shortDescription: "Pieza artesanal",
  longDescription: null,
  featured: false,
  category: null,
  brand: null,
  imageUrl: null,
  mediumThumbnailUrl: null,
  smallThumbnailUrl: null,
  minPrice: 250,
  minDiscountPrice: null,
  createdAt: "2026-01-01T00:00:00",
  materials: [],
  variants: [
    {
      productVariantId: 1,
      price: 250,
      discountPrice: null,
      stock: 5,
      attributeValues: [{ attributeValueId: 9, value: "Talla 6" }],
    },
    {
      productVariantId: 2,
      price: 300,
      discountPrice: 270,
      stock: 3,
      attributeValues: [{ attributeValueId: 10, value: "Talla 7" }],
    },
  ],
};

function cartValue(overrides: Partial<CartContextValue>): CartContextValue {
  return {
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
    ...overrides,
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/product/abc-123"]}>
        <Routes>
          <Route path="/product/:productId" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getPublicProduct).mockResolvedValue(product);
  mockedUseCart.mockReturnValue(cartValue({}));
});

describe("ProductDetailPage", () => {
  it("renders a variant select with an option per variant", async () => {
    renderPage();

    expect(await screen.findByText("Anillo de plata")).toBeInTheDocument();
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Talla 6/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Talla 7/ })).toBeInTheDocument();
  });

  it("adds the selected variant to the cart and opens the drawer", async () => {
    const addItem = vi.fn().mockResolvedValue(undefined);
    const openDrawer = vi.fn();
    mockedUseCart.mockReturnValue(cartValue({ addItem, openDrawer }));

    renderPage();
    await screen.findByText("Anillo de plata");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );

    await waitFor(() => expect(addItem).toHaveBeenCalledTimes(1));
    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productVariantId: 2,
        quantity: 1,
        productName: "Anillo de plata",
        unitPrice: 270,
        availableStock: 3,
        productId: "abc-123",
      }),
    );
    expect(openDrawer).toHaveBeenCalled();
  });

  it("defaults to the first variant when none is chosen", async () => {
    const addItem = vi.fn().mockResolvedValue(undefined);
    mockedUseCart.mockReturnValue(cartValue({ addItem }));

    renderPage();
    await screen.findByText("Anillo de plata");

    fireEvent.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );

    await waitFor(() => expect(addItem).toHaveBeenCalledTimes(1));
    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({ productVariantId: 1, unitPrice: 250 }),
    );
  });
});
