import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import type { LoginResponse, OrderSummaryResponse } from "@/api/api";
import OrdersListPage from "./OrdersListPage";

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/hooks/useApiErrorHandler", () => ({
  useApiErrorHandler: () => ({ throwOnError: vi.fn(), handleError: vi.fn() }),
}));
vi.mock("@/components/navbar/Navbar", () => ({ default: () => null }));
vi.mock("react-router-dom", () => ({
  Link: ({
    to,
    state,
    children,
  }: {
    to: string;
    state?: unknown;
    children: ReactNode;
  }) => (
    <a href={to} data-state={state ? JSON.stringify(state) : undefined}>
      {children}
    </a>
  ),
}));

const mockedUseQuery = vi.mocked(useQuery);
const mockedUseUser = vi.mocked(useUser);

function setUser() {
  mockedUseUser.mockReturnValue({
    user: { token: "tok" } as LoginResponse,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

function summary(overrides: Partial<OrderSummaryResponse>): OrderSummaryResponse {
  return {
    orderNumber: "ORD-20260101-1",
    status: "PENDING",
    total: 199,
    totalItems: 2,
    createdAt: "2026-01-01T00:00:00",
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("OrdersListPage", () => {
  it("lists orders most-recent-first with links to detail carrying no justPurchased state", () => {
    setUser();
    // Backend already returns most-recent-first; the page must render them
    // in the given order, not re-sort.
    const orders = [
      summary({ orderNumber: "ORD-2", createdAt: "2026-01-02T00:00:00" }),
      summary({ orderNumber: "ORD-1", createdAt: "2026-01-01T00:00:00" }),
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseQuery.mockReturnValue({ data: orders, isLoading: false } as any);

    render(<OrdersListPage />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/pedido/ORD-2");
    expect(links[1]).toHaveAttribute("href", "/pedido/ORD-1");
    expect(links[0]).not.toHaveAttribute("data-state");
    expect(links[1]).not.toHaveAttribute("data-state");
  });

  it("shows an empty state when the caller has no orders", () => {
    setUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseQuery.mockReturnValue({ data: [], isLoading: false } as any);

    render(<OrdersListPage />);

    expect(screen.getByText("Aún no tienes pedidos")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("shows a loading state while the query is pending", () => {
    setUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseQuery.mockReturnValue({ data: undefined, isLoading: true } as any);

    render(<OrdersListPage />);

    expect(screen.queryByText("Aún no tienes pedidos")).not.toBeInTheDocument();
  });
});
