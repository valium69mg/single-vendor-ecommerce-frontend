import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { PublicCategory } from "@/api/api";
import CategoryCard from "./CategoryCard";

function category(overrides: Partial<PublicCategory> = {}): PublicCategory {
  return {
    categoryId: 5,
    name: "Anillos",
    slug: "anillos",
    products: 12,
    imageUrl: null,
    mediumThumbnailUrl: null,
    smallThumbnailUrl: null,
    ...overrides,
  };
}

function renderCard(cat: PublicCategory) {
  return render(
    <MemoryRouter>
      <CategoryCard category={cat} />
    </MemoryRouter>,
  );
}

describe("CategoryCard", () => {
  it("links to the category slug detail route", () => {
    renderCard(category());

    expect(screen.getByRole("link", { name: /Anillos/ })).toHaveAttribute(
      "href",
      "/category/anillos",
    );
  });

  it("uses the slug, not the numeric id, in the link", () => {
    renderCard(category({ categoryId: 99, slug: "collares", name: "Collares" }));

    expect(screen.getByRole("link", { name: /Collares/ })).toHaveAttribute(
      "href",
      "/category/collares",
    );
  });
});
