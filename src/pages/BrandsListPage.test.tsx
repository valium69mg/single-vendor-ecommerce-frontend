import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "@/api/api";
import BrandsListPage from "./BrandsListPage";

vi.mock("@/components/navbar/Navbar", () => ({ default: () => null }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, getBrands: vi.fn() };
});

function page(content: api.PublicBrand[]): api.PageResponse<api.PublicBrand> {
  return {
    content,
    page: 0,
    size: 100,
    totalElements: content.length,
    totalPages: 1,
    last: true,
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BrandsListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BrandsListPage", () => {
  beforeEach(() => {
    vi.mocked(api.getBrands).mockReset();
  });

  it("renders every brand name as a link to its /brand/:slug route", async () => {
    vi.mocked(api.getBrands).mockResolvedValue(
      page([
        { brandId: 1, name: "Cartier", slug: "cartier" },
        { brandId: 2, name: "Bvlgari", slug: "bvlgari" },
      ]),
    );

    renderPage();

    const cartier = await screen.findByRole("link", { name: "Cartier" });
    expect(cartier).toHaveAttribute("href", "/brand/cartier");
    expect(screen.getByRole("link", { name: "Bvlgari" })).toHaveAttribute(
      "href",
      "/brand/bvlgari",
    );
  });

  it("fetches the full brand list once with an empty term", async () => {
    vi.mocked(api.getBrands).mockResolvedValue(
      page([{ brandId: 7, name: "Tiffany", slug: "tiffany" }]),
    );

    renderPage();

    await screen.findByRole("link", { name: "Tiffany" });
    expect(api.getBrands).toHaveBeenCalledTimes(1);
    expect(api.getBrands).toHaveBeenCalledWith(0, 100, "");
  });

  it("shows the empty-state copy when there are no brands", async () => {
    vi.mocked(api.getBrands).mockResolvedValue(page([]));

    renderPage();

    expect(
      await screen.findByText("No hay marcas disponibles por el momento."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
