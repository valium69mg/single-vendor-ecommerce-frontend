import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import * as api from "@/api/api";
import NavbarCategories from "./NavbarCategories";

const navigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

// Render the Radix dropdown structure inline so the menu items are always in the
// DOM for assertions — this is a focused test of the navigation targets.
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, getCategories: vi.fn() };
});

function page(content: api.PublicCategory[]): api.PageResponse<api.PublicCategory> {
  return {
    content,
    page: 0,
    size: 5,
    totalElements: content.length,
    totalPages: 1,
    last: true,
  };
}

function renderNavbarCategories() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NavbarCategories />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const category: api.PublicCategory = {
  categoryId: 5,
  name: "Anillos",
  slug: "anillos",
  products: 3,
  imageUrl: null,
  mediumThumbnailUrl: null,
  smallThumbnailUrl: null,
};

describe("NavbarCategories", () => {
  beforeEach(() => {
    navigate.mockReset();
    vi.mocked(api.getCategories).mockReset();
  });

  it("navigates to the category slug detail route when an item is clicked", async () => {
    vi.mocked(api.getCategories).mockResolvedValue(page([category]));

    renderNavbarCategories();

    fireEvent.click(await screen.findByText("Anillos"));

    expect(navigate).toHaveBeenCalledWith("/category/anillos");
  });

  it("navigates to the categories list route from 'Ver todas'", async () => {
    vi.mocked(api.getCategories).mockResolvedValue(page([category]));

    renderNavbarCategories();

    fireEvent.click(await screen.findByText("Ver todas"));

    expect(navigate).toHaveBeenCalledWith("/categories");
  });
});
