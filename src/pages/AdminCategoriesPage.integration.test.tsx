import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import type { Category, LoginResponse } from "@/api/api";
import { server } from "@/mocks/server";
import AdminCategoriesPage from "@/pages/AdminCategoriesPage";
import { UserProvider } from "@/providers/UserProvider";

/**
 * Page-level integration test: mounts the real `AdminCategoriesPage`, which
 * wires `useUser` (token from `UserProvider`) -> `useQuery` ->
 * `getAdminCategories` -> the real `apiFetch`/`fetch` pipeline -> `DataTable`
 * rendering. Only `fetch` is intercepted, via MSW; nothing is `vi.mock`ed.
 *
 * `AdminCategoriesPage` gates its query with `enabled: !!user?.token`
 * (see `src/pages/AdminCategoriesPage.tsx`), so `UserProvider` must already
 * see an ADMIN session in `localStorage["loginData"]` before render — hence
 * seeding it in `beforeEach`, mirroring the pattern in
 * `src/providers/UserProvider.test.tsx`.
 */

const ADMIN_SESSION: LoginResponse = {
  userId: "u-1",
  email: "admin@example.com",
  name: "Admin",
  token: "admin-token",
  role: "ADMIN",
};

function fakeCategory(overrides: Partial<Category> = {}): Category {
  return {
    categoryId: 1,
    name: "Anillos",
    products: 5,
    unitsSold: 10,
    revenue: 500,
    averagePrice: 50,
    stock: 20,
    imageUrl: null,
    mediumThumbnailUrl: null,
    smallThumbnailUrl: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <UserProvider>
        <MemoryRouter>
          <AdminCategoriesPage />
        </MemoryRouter>
      </UserProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("loginData", JSON.stringify(ADMIN_SESSION));
});

describe("AdminCategoriesPage (MSW integration)", () => {
  it("renders DataTable rows sourced from the MSW-served admin categories page", async () => {
    server.use(
      http.get("*/api/v1/admin/products/categories", () =>
        HttpResponse.json({
          content: [
            fakeCategory({ categoryId: 1, name: "Collares" }),
            fakeCategory({ categoryId: 2, name: "Pulseras" }),
          ],
          page: 0,
          size: 10,
          totalElements: 2,
          totalPages: 1,
          last: true,
        }),
      ),
    );

    renderPage();

    expect(await screen.findByText("Collares")).toBeInTheDocument();
    expect(screen.getByText("Pulseras")).toBeInTheDocument();
  });
});
