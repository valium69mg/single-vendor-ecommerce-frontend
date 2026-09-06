import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useUser } from "@/hooks/useUser";
import NavbarProfile from "./NavbarProfile";

const navigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});
vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));

// Render Radix's dropdown structure inline so menu items stay in the DOM for
// assertions — same convention as NavbarCategories.test.tsx.
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUser).mockReturnValue({ user: null, setUser: vi.fn(), logout: vi.fn() });
});

describe("NavbarProfile guest menu", () => {
  it("navigates to /registro when the register item is clicked", () => {
    render(<NavbarProfile />);
    fireEvent.click(screen.getByText("Registrarse"));
    expect(navigate).toHaveBeenCalledWith("/registro");
  });
});

describe("NavbarProfile authenticated menu", () => {
  beforeEach(() => {
    vi.mocked(useUser).mockReturnValue({
      user: { email: "shopper@test.com", role: "USER" } as never,
      setUser: vi.fn(),
      logout: vi.fn(),
    });
  });

  it("points 'Mi Perfil' at the /mi-cuenta/perfil account route", () => {
    render(<NavbarProfile />);
    fireEvent.click(screen.getByText("Mi Perfil"));
    expect(navigate).toHaveBeenCalledWith("/mi-cuenta/perfil");
  });

  it("no longer renders a 'Configuración' item", () => {
    render(<NavbarProfile />);
    expect(screen.queryByText("Configuración")).not.toBeInTheDocument();
  });
});
