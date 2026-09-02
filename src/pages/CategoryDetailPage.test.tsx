import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "@/api/api";
import { ApiError } from "@/api/apiFetch";
import CategoryDetailPage from "./CategoryDetailPage";

vi.mock("@/components/navbar/Navbar", () => ({ default: () => null }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, getCategoryBySlug: vi.fn(), getProducts: vi.fn() };
});

const category: api.PublicCategoryBySlug = {
  categoryId: 5,
  name: "Anillos",
  slug: "anillos",
  products: 2,
  imageUrl: null,
  mediumThumbnailUrl: null,
  smallThumbnailUrl: null,
};

function product(id: string, name: string, slug: string): api.PublicProduct {
  return {
    productId: id,
    slug,
    name,
    shortDescription: null,
    featured: false,
    status: "ACTIVE",
    category: { categoryId: 5, name: "Anillos", slug: "anillos" },
    brand: null,
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
    product("p-1", "Anillo de oro", "anillo-de-oro"),
    product("p-2", "Anillo de plata", "anillo-de-plata"),
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

function renderPage(slug = "anillos") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/category/${slug}`]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryDetailPage />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getCategoryBySlug).mockResolvedValue(category);
  vi.mocked(api.getProducts).mockResolvedValue(productsPage);
});

describe("CategoryDetailPage", () => {
  it("resolves the category by its slug param and shows its name as a heading", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Anillos" }),
    ).toBeInTheDocument();
    expect(api.getCategoryBySlug).toHaveBeenCalledWith("anillos");
  });

  it("renders a product grid filtered by the category id", async () => {
    renderPage();

    expect(await screen.findByText("Anillo de oro")).toBeInTheDocument();
    expect(screen.getByText("Anillo de plata")).toBeInTheDocument();
    expect(api.getProducts).toHaveBeenCalledWith(0, 24, undefined, undefined, {
      categoryId: 5,
    });
  });

  it("shows an i18n empty-state message when the category has no products", async () => {
    vi.mocked(api.getProducts).mockResolvedValue({
      ...productsPage,
      content: [],
    });

    renderPage();

    expect(
      await screen.findByText("No hay productos en esta categoría todavía."),
    ).toBeInTheDocument();
  });

  it("renders NotFoundPage when the category API responds 404", async () => {
    vi.mocked(api.getCategoryBySlug).mockRejectedValue(
      new ApiError("category_not_found", 404, { error: "category_not_found" }),
    );

    renderPage("does-not-exist");

    expect(
      await screen.findByRole("heading", { name: "Página no encontrada" }),
    ).toBeInTheDocument();
  });

  it("replaces the URL with the canonical slug when the returned slug differs", async () => {
    vi.mocked(api.getCategoryBySlug).mockResolvedValue({
      ...category,
      slug: "anillos",
    });

    renderPage("anillos-viejos");

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/category/anillos",
      ),
    );
  });
});
