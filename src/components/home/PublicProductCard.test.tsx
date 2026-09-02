import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { PublicProduct } from "@/api/api";
import PublicProductCard from "./PublicProductCard";

const product: PublicProduct = {
  productId: "abc-123",
  slug: "anillo-de-plata",
  name: "Anillo de plata",
  shortDescription: null,
  featured: false,
  status: "ACTIVE",
  category: { categoryId: 1, name: "Anillos", slug: "anillos" },
  brand: null,
  imageUrl: null,
  mediumThumbnailUrl: null,
  smallThumbnailUrl: null,
  minPrice: 250,
  maxPrice: 250,
  minDiscountPrice: 250,
  totalStock: 4,
};

function renderCard(overrides: Partial<PublicProduct> = {}) {
  return render(
    <MemoryRouter>
      <PublicProductCard product={{ ...product, ...overrides }} />
    </MemoryRouter>,
  );
}

describe("PublicProductCard", () => {
  it("links to the product detail page by slug, not by id", () => {
    renderCard();

    const link = screen.getByRole("link", { name: /Anillo de plata/ });
    expect(link).toHaveAttribute("href", "/product/anillo-de-plata");
  });

  it("uses the slug from the product when it changes (triangulation)", () => {
    renderCard({ slug: "collar-de-oro", name: "Collar de oro" });

    expect(
      screen.getByRole("link", { name: /Collar de oro/ }),
    ).toHaveAttribute("href", "/product/collar-de-oro");
  });
});
