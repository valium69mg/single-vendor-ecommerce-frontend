import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";

vi.mock("./pages/LoginPage", () => ({ default: () => <div>login page</div> }));
vi.mock("./pages/HomePage", () => ({ default: () => <div>home page</div> }));
vi.mock("./pages/CartPage", () => ({ default: () => <div>cart page</div> }));
vi.mock("./pages/ProductDetailPage", () => ({
  default: () => <div>product detail page</div>,
}));
vi.mock("./pages/AdminHomePage", () => ({ default: () => <div>admin home</div> }));
vi.mock("./pages/AdminProductsPage", () => ({
  default: () => <div>admin products</div>,
}));
vi.mock("./pages/AdminCategoriesPage", () => ({
  default: () => <div>admin categories</div>,
}));
vi.mock("./pages/AdminCategoryDetailPage", () => ({
  default: () => <div>admin category detail</div>,
}));
vi.mock("./components/auth/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/navbar/Navbar", () => ({
  default: () => <nav data-testid="navbar" />,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("AppRoutes", () => {
  it("renders NotFoundPage for an unmatched URL", () => {
    renderAt("/nonsense");
    expect(
      screen.getByRole("heading", { name: "Página no encontrada" }),
    ).toBeInTheDocument();
  });

  it("resolves the product detail route", () => {
    renderAt("/product/gold-rings");
    expect(screen.getByText("product detail page")).toBeInTheDocument();
  });

  it("renders the home page at the root", () => {
    renderAt("/");
    expect(screen.getByText("home page")).toBeInTheDocument();
  });
});
