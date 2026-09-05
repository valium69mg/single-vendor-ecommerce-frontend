import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import type { LoginResponse, OrderResponse } from "@/api/api";
import OrderDetailPage from "./OrderDetailPage";

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/hooks/useApiErrorHandler", () => ({
  useApiErrorHandler: () => ({ throwOnError: vi.fn(), handleError: vi.fn() }),
}));
vi.mock("@/components/navbar/Navbar", () => ({ default: () => null }));
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(),
  useLocation: vi.fn(),
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const mockedUseQuery = vi.mocked(useQuery);
const mockedUseUser = vi.mocked(useUser);
const mockedUseParams = vi.mocked(useParams);
const mockedUseLocation = vi.mocked(useLocation);

function setUser() {
  mockedUseUser.mockReturnValue({
    user: { token: "tok" } as LoginResponse,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

const ORDER: OrderResponse = {
  orderId: 1,
  orderNumber: "ORD-20260101-1",
  status: "PENDING",
  subtotal: 200,
  shippingCost: 99,
  total: 299,
  shippingAddress: {
    recipient: "Jane Doe",
    line1: "Av. Reforma 123",
    city: "CDMX",
    state: "CDMX",
    postalCode: "01000",
    country: "MX",
    phone: "5555555555",
  },
  items: [
    {
      orderItemId: 1,
      productVariantId: 10,
      productName: "Anillo",
      variantLabel: "Oro 18k",
      sku: "SKU-1",
      unitPrice: 100,
      quantity: 2,
      lineTotal: 200,
    },
  ],
  createdAt: "2026-01-01T00:00:00",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseParams.mockReturnValue({ orderNumber: "ORD-20260101-1" });
});

describe("OrderDetailPage", () => {
  it("shows the success banner when reached via checkout's justPurchased navigation state", () => {
    setUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseLocation.mockReturnValue({ state: { justPurchased: true } } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseQuery.mockReturnValue({ data: ORDER, isLoading: false } as any);

    render(<OrderDetailPage />);

    expect(screen.getByText("¡Gracias por tu compra!")).toBeInTheDocument();
  });

  it("does not show the success banner when reached without justPurchased state (e.g. from the list or a direct URL)", () => {
    setUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseLocation.mockReturnValue({ state: null } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseQuery.mockReturnValue({ data: ORDER, isLoading: false } as any);

    render(<OrderDetailPage />);

    expect(
      screen.queryByText("¡Gracias por tu compra!"),
    ).not.toBeInTheDocument();
    expect(document.body.textContent).toContain("ORD-20260101-1");
  });

  it("does not show the banner on a refresh of the same route even if history briefly retains no state", () => {
    setUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseLocation.mockReturnValue({ state: undefined } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseQuery.mockReturnValue({ data: ORDER, isLoading: false } as any);

    render(<OrderDetailPage />);

    expect(
      screen.queryByText("¡Gracias por tu compra!"),
    ).not.toBeInTheDocument();
  });

  it("renders order items, totals, and shipping address", () => {
    setUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseLocation.mockReturnValue({ state: null } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseQuery.mockReturnValue({ data: ORDER, isLoading: false } as any);

    render(<OrderDetailPage />);

    expect(screen.getByText("Anillo")).toBeInTheDocument();
    expect(screen.getByText("Oro 18k")).toBeInTheDocument();
    // line total (200) and subtotal (200) share the same formatted value
    expect(screen.getAllByText("$200.00")).toHaveLength(2);
    expect(screen.getByText("$299.00")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("shows the not-found message when the order does not exist or is not owned by the caller", () => {
    setUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseLocation.mockReturnValue({ state: null } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseQuery.mockReturnValue({ data: undefined, isLoading: false } as any);

    render(<OrderDetailPage />);

    expect(screen.getByText("Pedido no encontrado")).toBeInTheDocument();
  });
});
