import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";

const navigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/hooks/useRegisterFlow", () => ({ useRegisterFlow: vi.fn() }));
vi.mock("@/components/auth/RegisterForm", () => ({
  default: ({
    onRegistered,
  }: {
    onRegistered: (email: string, password: string) => void;
  }) => (
    <button
      data-testid="register-form"
      onClick={() => onRegistered("user@example.com", "Secret12!")}
    >
      register-form
    </button>
  ),
}));
vi.mock("@/components/auth/VerifyEmailForm", () => ({
  default: () => <div data-testid="verify-form" />,
}));

import { useUser } from "@/hooks/useUser";
import { useRegisterFlow } from "@/hooks/useRegisterFlow";
import type { LoginResponse } from "@/api/api";
import RegisterPage from "./RegisterPage";

const mockedUseUser = vi.mocked(useUser);
const mockedUseRegisterFlow = vi.mocked(useRegisterFlow);

function baseUser(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    userId: "u1",
    email: "user@example.com",
    name: "Ada",
    token: "jwt",
    role: "USER",
    isVerified: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseUser.mockReturnValue({ user: null, setUser: vi.fn(), logout: vi.fn() });
  mockedUseRegisterFlow.mockReturnValue({
    onRegistered: vi.fn(),
    isLoggingIn: false,
  });
});

describe("RegisterPage — register step", () => {
  it("renders the register form when there is no session", () => {
    render(<RegisterPage />);
    expect(screen.getByTestId("register-form")).toBeInTheDocument();
  });

  it("renders a link back to /login", () => {
    render(<RegisterPage />);
    const link = screen.getByText("¿Ya tienes una cuenta?");
    expect(link.closest("a")).toHaveAttribute("href", "/login");
  });

  it("switches to the verify step when the register flow reports isVerified: false", () => {
    let capturedOnUnverified: (() => void) | undefined;
    mockedUseRegisterFlow.mockImplementation(({ onUnverified }) => {
      capturedOnUnverified = onUnverified;
      return { onRegistered: () => capturedOnUnverified?.(), isLoggingIn: false };
    });

    render(<RegisterPage />);
    fireEvent.click(screen.getByTestId("register-form"));

    expect(screen.getByTestId("verify-form")).toBeInTheDocument();
    expect(screen.queryByTestId("register-form")).not.toBeInTheDocument();
  });
});

describe("RegisterPage — verify step", () => {
  it("starts on the verify step when the stored session is unverified", () => {
    mockedUseUser.mockReturnValue({
      user: baseUser({ isVerified: false }),
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    render(<RegisterPage />);

    expect(screen.getByTestId("verify-form")).toBeInTheDocument();
    expect(screen.queryByTestId("register-form")).not.toBeInTheDocument();
  });
});

describe("RegisterPage — verified landing", () => {
  it("navigates a verified USER to the storefront", () => {
    mockedUseUser.mockReturnValue({
      user: baseUser({ isVerified: true, role: "USER" }),
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    render(<RegisterPage />);

    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("navigates a verified ADMIN to the admin area", () => {
    mockedUseUser.mockReturnValue({
      user: baseUser({ isVerified: true, role: "ADMIN" }),
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    render(<RegisterPage />);

    expect(navigate).toHaveBeenCalledWith("/admin", { replace: true });
  });
});
