import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "@/api/api";
import { ApiError } from "@/api/apiFetch";
import BrandDetailPage from "./BrandDetailPage";

vi.mock("@/components/navbar/Navbar", () => ({ default: () => null }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, getBrandBySlug: vi.fn(), getProducts: vi.fn() };
});

const brand: api.PublicBrandBySlug = {
  brandId: 8,
  name: "Cartier",
  slug: "cartier",
};

function product(id: string, name: string, slug: string): api.PublicProduct {
  return {
    productId: id,
    slug,
    name,
    shortDescription: null,
    featured: false,
    status: "ACTIVE",
    category: null,
    brand: { brandId: 8, name: "Cartier", slug: "cartier" },
    imageUrl: null,
    mediumThumbnailUrl: null,
    smallThumbnailUrl: null,
    minPrice: 100,
    maxPrice: 100,
    minDiscountPrice: 100,
    totalStock: 3,
  };
}

const productsPage: api.PageResponse<api.PublicProduct> = {
  content: [
    product("p-1", "Reloj Tank", "reloj-tank"),
    product("p-2", "Pulsera Love", "pulsera-love"),
  ],
  page: 0,
  size: 24,
  totalElements: 2,
  totalPages: 1,
  last: true,
};

function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="location">{pathname}</div>;
}

function renderPage(slug = "cartier") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/brand/${slug}`]}>
        <Routes>
          <Route path="/brand/:slug" element={<BrandDetailPage />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getBrandBySlug).mockResolvedValue(brand);
  vi.mocked(api.getProducts).mockResolvedValue(productsPage);
});

describe("BrandDetailPage", () => {
  it("resolves the brand by its slug param and shows its name as a heading", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Cartier" }),
    ).toBeInTheDocument();
    expect(api.getBrandBySlug).toHaveBeenCalledWith("cartier");
  });

  it("renders a product grid filtered by the brand id", async () => {
    renderPage();

    expect(await screen.findByText("Reloj Tank")).toBeInTheDocument();
    expect(screen.getByText("Pulsera Love")).toBeInTheDocument();
    expect(api.getProducts).toHaveBeenCalledWith(0, 24, undefined, undefined, {
      brandId: 8,
    });
  });

  it("shows an i18n empty-state message when the brand has no products", async () => {
    vi.mocked(api.getProducts).mockResolvedValue({
      ...productsPage,
      content: [],
    });

    renderPage();

    expect(
      await screen.findByText("No hay productos de esta marca todavía."),
    ).toBeInTheDocument();
  });

  it("renders NotFoundPage when the brand API responds 404", async () => {
    vi.mocked(api.getBrandBySlug).mockRejectedValue(
      new ApiError("brand_does_not_exists", 404, {
        error: "brand_does_not_exists",
      }),
    );

    renderPage("does-not-exist");

    expect(
      await screen.findByRole("heading", { name: "Página no encontrada" }),
    ).toBeInTheDocument();
  });

  it("replaces the URL with the canonical slug when the returned slug differs", async () => {
    vi.mocked(api.getBrandBySlug).mockResolvedValue({ ...brand, slug: "cartier" });

    renderPage("cartier-old");

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/brand/cartier",
      ),
    );
  });
});
