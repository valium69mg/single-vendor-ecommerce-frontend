import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const navigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/components/auth/RegisterForm", () => ({
  default: () => <div data-testid="register-form" />,
}));

import RegisterPage from "./RegisterPage";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RegisterPage", () => {
  it("renders the register form", () => {
    render(<RegisterPage />);
    expect(screen.getByTestId("register-form")).toBeInTheDocument();
  });

  it("renders a link back to /login", () => {
    render(<RegisterPage />);
    const link = screen.getByText("¿Ya tienes una cuenta?");
    expect(link.closest("a")).toHaveAttribute("href", "/login");
  });
});
