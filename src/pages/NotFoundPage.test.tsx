import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFoundPage from "./NotFoundPage";

vi.mock("@/components/navbar/Navbar", () => ({
  default: () => <nav data-testid="navbar" />,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe("NotFoundPage", () => {
  it("renders the store navbar", () => {
    renderPage();
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  it("shows the not-found heading and body from i18n", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Página no encontrada" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Lo sentimos, la página que buscas no existe o fue movida.",
      ),
    ).toBeInTheDocument();
  });

  it("renders a home CTA link with the square store button style", () => {
    renderPage();
    const cta = screen.getByRole("link", { name: "Volver al inicio" });
    expect(cta).toHaveAttribute("href", "/");
    expect(cta).toHaveClass("rounded-none");
  });

  it("uses the store heading font for the title", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Página no encontrada" }),
    ).toHaveClass("font-store-heading");
  });
});
