import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "@/api/api";
import CategoriesListPage from "./CategoriesListPage";

vi.mock("@/components/navbar/Navbar", () => ({ default: () => null }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, getCategories: vi.fn() };
});

function page(content: api.PublicCategory[]): api.PageResponse<api.PublicCategory> {
  return {
    content,
    page: 0,
    size: 100,
    totalElements: content.length,
    totalPages: 1,
    last: true,
  };
}

function category(id: number, name: string, slug: string): api.PublicCategory {
  return {
    categoryId: id,
    name,
    slug,
    products: 0,
    imageUrl: null,
    mediumThumbnailUrl: null,
    smallThumbnailUrl: null,
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CategoriesListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CategoriesListPage", () => {
  beforeEach(() => {
    vi.mocked(api.getCategories).mockReset();
  });

  it("renders every category name as a link to its /category/:slug route", async () => {
    vi.mocked(api.getCategories).mockResolvedValue(
      page([category(5, "Anillos", "anillos"), category(9, "Collares", "collares")]),
    );

    renderPage();

    const anillos = await screen.findByRole("link", { name: "Anillos" });
    expect(anillos).toHaveAttribute("href", "/category/anillos");
    expect(screen.getByRole("link", { name: "Collares" })).toHaveAttribute(
      "href",
      "/category/collares",
    );
  });

  it("fetches the full category list once with an empty term", async () => {
    vi.mocked(api.getCategories).mockResolvedValue(page([category(1, "Aros", "aros")]));

    renderPage();

    await screen.findByRole("link", { name: "Aros" });
    expect(api.getCategories).toHaveBeenCalledTimes(1);
    expect(api.getCategories).toHaveBeenCalledWith(0, 100, "");
  });

  it("shows the empty-state copy when there are no categories", async () => {
    vi.mocked(api.getCategories).mockResolvedValue(page([]));

    renderPage();

    expect(
      await screen.findByText("No hay categorías disponibles por el momento."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
