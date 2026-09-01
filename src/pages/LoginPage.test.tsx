import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const navigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));
vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("../hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/components/auth/LoginForm", () => ({
  default: () => <div data-testid="login-form" />,
}));

import { useUser } from "../hooks/useUser";
import LoginPage from "./LoginPage";
import type { LoginResponse } from "@/api/api";

const mockedUseUser = vi.mocked(useUser);

function asRole(role: string | null) {
  mockedUseUser.mockReturnValue({
    user: role ? ({ role } as LoginResponse) : null,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage role-based redirect", () => {
  it("redirects an ADMIN to /admin", () => {
    asRole("ADMIN");
    render(<LoginPage />);
    expect(navigate).toHaveBeenCalledWith("/admin", { replace: true });
  });

  it("redirects a USER to /", () => {
    asRole("USER");
    render(<LoginPage />);
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("redirects any other/unknown role to / (fallback, user not stranded)", () => {
    asRole("MANAGER");
    render(<LoginPage />);
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("renders the login form and does not redirect when logged out", () => {
    asRole(null);
    render(<LoginPage />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
