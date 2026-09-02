import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { getPublicProduct, type PublicProductById } from "@/api/api";
import { server } from "@/mocks/server";

/**
 * Integration smoke test: the real `getPublicProduct` -> real `apiFetch` -> real
 * `fetch` call is served entirely by an MSW handler. No fetch stub, no module mock.
 */

function ProductName({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ["public-product", id],
    queryFn: () => getPublicProduct(id),
  });
  return <h1>{data?.name ?? "loading"}</h1>;
}

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function fakeProduct(overrides: Partial<PublicProductById>): PublicProductById {
  return {
    productId: "abc-123",
    slug: "anillo-de-compromiso",
    name: "Anillo de Compromiso",
    shortDescription: null,
    longDescription: null,
    featured: false,
    category: null,
    brand: null,
    imageUrl: null,
    mediumThumbnailUrl: null,
    smallThumbnailUrl: null,
    minPrice: 1000,
    minDiscountPrice: null,
    createdAt: "2026-01-01T00:00:00Z",
    materials: [],
    variants: [],
    ...overrides,
  };
}

describe("public product detail (MSW integration)", () => {
  it("renders the product name served by the MSW handler", async () => {
    server.use(
      http.get("*/api/v1/products/:id", ({ params }) =>
        HttpResponse.json(
          fakeProduct({ productId: String(params.id), name: "Collar de Oro" }),
        ),
      ),
    );

    renderWithClient(<ProductName id="p-1" />);

    expect(
      await screen.findByRole("heading", { name: "Collar de Oro" }),
    ).toBeInTheDocument();
  });

  it("renders a different mocked product (triangulation — value comes from the response)", async () => {
    server.use(
      http.get("*/api/v1/products/:id", () =>
        HttpResponse.json(fakeProduct({ name: "Aretes de Plata" })),
      ),
    );

    renderWithClient(<ProductName id="p-2" />);

    expect(
      await screen.findByRole("heading", { name: "Aretes de Plata" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Collar de Oro" })).toBeNull();
  });
});

describe("unhandled request errors (MSW integration)", () => {
  // No `server.use(...)` here and `handlers` is empty, so this request matches
  // no handler. `onUnhandledRequest: "error"` (src/test/setup.ts) must turn that
  // into a failed request, not a silent pass-through or a mere console warning.

  it("rejects a real API call whose endpoint has no registered handler", async () => {
    await expect(getPublicProduct("no-handler-for-this")).rejects.toThrow(
      /\[MSW\]/,
    );
  });

  it("rejects a bare fetch to an endpoint no handler covers", async () => {
    await expect(
      fetch("http://localhost:8080/api/v1/does-not-exist"),
    ).rejects.toThrow(/\[MSW\]/);
  });
});
