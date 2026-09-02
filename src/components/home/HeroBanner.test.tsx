import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeroBanner from "./HeroBanner";

function renderHero() {
  return render(
    <MemoryRouter>
      <HeroBanner />
    </MemoryRouter>,
  );
}

describe("HeroBanner", () => {
  it("wires the categories CTA to the real /categories route", () => {
    renderHero();

    expect(
      screen.getByRole("link", { name: /Ver Categorías/ }),
    ).toHaveAttribute("href", "/categories");
  });

  it("leaves the collection CTA pointing at the not-yet-built /products browse page", () => {
    renderHero();

    // Non-goal: the public product-list / browse page is out of scope, so this
    // link stays intentionally unwired.
    expect(
      screen.getByRole("link", { name: /Explorar Colección/ }),
    ).toHaveAttribute("href", "/products");
  });
});
