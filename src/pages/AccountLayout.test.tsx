import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "@/providers/UserProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AccountLayout from "./AccountLayout";

vi.mock("@/components/navbar/Navbar", () => ({ default: () => null }));
vi.mock("./ProfilePage", () => ({ default: () => <div>PROFILE PAGE</div> }));
vi.mock("./AddressesPage", () => ({ default: () => <div>ADDRESSES PAGE</div> }));

function renderAt(path: string) {
  return render(
    <UserProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
          <Route
            path="/mi-cuenta"
            element={
              <ProtectedRoute>
                <AccountLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="perfil" replace />} />
            <Route path="perfil" element={<div>PROFILE PAGE</div>} />
            <Route path="direcciones" element={<div>ADDRESSES PAGE</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </UserProvider>,
  );
}

const LOGIN_DATA = JSON.stringify({
  userId: "u1",
  email: "shopper@test.com",
  name: "Shopper",
  token: "test-token",
  role: "USER",
  isVerified: true,
});

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("AccountLayout guard + shell", () => {
  it("redirects to /login when there is no logged-in user", () => {
    renderAt("/mi-cuenta/perfil");
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
    expect(screen.queryByText("PROFILE PAGE")).not.toBeInTheDocument();
  });

  it("renders the sidebar links for a logged-in user", () => {
    localStorage.setItem("loginData", LOGIN_DATA);
    renderAt("/mi-cuenta/perfil");

    const profileLink = screen.getByRole("link", { name: "Mi perfil" });
    expect(profileLink).toHaveAttribute("href", "/mi-cuenta/perfil");
    expect(screen.getByRole("link", { name: "Mis órdenes" })).toHaveAttribute(
      "href",
      "/pedidos",
    );
    expect(screen.getByRole("link", { name: "Direcciones" })).toHaveAttribute(
      "href",
      "/mi-cuenta/direcciones",
    );
    // Wishlist is visual-only — present as text but never a link.
    expect(screen.getByText("Lista de deseos")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Lista de deseos" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    ).toBeInTheDocument();
  });

  it("redirects the /mi-cuenta index to /mi-cuenta/perfil", () => {
    localStorage.setItem("loginData", LOGIN_DATA);
    renderAt("/mi-cuenta");
    expect(screen.getByText("PROFILE PAGE")).toBeInTheDocument();
  });
});
