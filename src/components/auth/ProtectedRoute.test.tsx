import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../../hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));

import { useUser } from "../../hooks/useUser";
import ProtectedRoute from "./ProtectedRoute";
import type { LoginResponse } from "@/api/api";

const mockedUseUser = vi.mocked(useUser);

function asUser(role: string | null) {
  mockedUseUser.mockReturnValue({
    user: role ? ({ role } as LoginResponse) : null,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

function renderAt(roles?: ("ADMIN" | "USER")[]) {
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute roles={roles}>
              <div>protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login screen</div>} />
        <Route path="/" element={<div>home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("ProtectedRoute", () => {
  it("redirects to /login when there is no user", () => {
    asUser(null);
    renderAt(["ADMIN"]);
    expect(screen.getByText("login screen")).toBeInTheDocument();
  });

  it("redirects to / when the user role is not allowed", () => {
    asUser("USER");
    renderAt(["ADMIN"]);
    expect(screen.getByText("home screen")).toBeInTheDocument();
  });

  it("renders children when the user role is allowed", () => {
    asUser("ADMIN");
    renderAt(["ADMIN"]);
    expect(screen.getByText("protected content")).toBeInTheDocument();
  });

  it("renders children when no role restriction is given and a user exists", () => {
    asUser("USER");
    renderAt();
    expect(screen.getByText("protected content")).toBeInTheDocument();
  });
});
