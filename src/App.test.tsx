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
vi.mock("./pages/CategoryDetailPage", () => ({
  default: () => <div>category detail page</div>,
}));
vi.mock("./pages/BrandDetailPage", () => ({
  default: () => <div>brand detail page</div>,
}));
vi.mock("./pages/CategoriesListPage", () => ({
  default: () => <div>categories list page</div>,
}));
vi.mock("./pages/BrandsListPage", () => ({
  default: () => <div>brands list page</div>,
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

  it("resolves the category detail route", () => {
    renderAt("/category/anillos");
    expect(screen.getByText("category detail page")).toBeInTheDocument();
  });

  it("resolves the brand detail route", () => {
    renderAt("/brand/cartier");
    expect(screen.getByText("brand detail page")).toBeInTheDocument();
  });

  it("resolves the categories list route", () => {
    renderAt("/categories");
    expect(screen.getByText("categories list page")).toBeInTheDocument();
  });

  it("resolves the brands list route", () => {
    renderAt("/brands");
    expect(screen.getByText("brands list page")).toBeInTheDocument();
  });
});
