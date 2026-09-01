import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
  },
}));
vi.mock("@/lib/authHandler", () => ({ handleUnauthorized: vi.fn() }));
vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));

import { handleUnauthorized } from "@/lib/authHandler";
import { useUser } from "@/hooks/useUser";
import { API_ERRORS } from "@/constants/apiErrors";
import { useApiErrorHandler } from "./useApiErrorHandler";

const logout = vi.fn();

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const clearSpy = vi.spyOn(client, "clear");
  const cancelSpy = vi.spyOn(client, "cancelQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, clearSpy, cancelSpy };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUser).mockReturnValue({
    user: null,
    setUser: vi.fn(),
    logout,
  });
});

describe("useApiErrorHandler", () => {
  it("keeps stable callback identities across a re-render with unchanged deps", () => {
    const { wrapper } = makeWrapper();
    const { result, rerender } = renderHook(() => useApiErrorHandler(), {
      wrapper,
    });

    const first = result.current;
    rerender();
    const second = result.current;

    expect(second.handleError).toBe(first.handleError);
    expect(second.throwOnError).toBe(first.throwOnError);
  });

  it("routes a 401 through queryClient.clear + handleUnauthorized(logout)", () => {
    const { wrapper, clearSpy } = makeWrapper();
    const { result } = renderHook(() => useApiErrorHandler(), { wrapper });

    result.current.handleError(new Error(API_ERRORS.UNAUTHORIZED));

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(handleUnauthorized).toHaveBeenCalledTimes(1);
    expect(handleUnauthorized).toHaveBeenCalledWith(logout);
  });

  it("shows the permission toast for a 403 and does not log out", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useApiErrorHandler(), { wrapper });

    result.current.handleError(new Error(API_ERRORS.FORBIDDEN));

    expect(toastError).toHaveBeenCalledWith(
      "No cuentas con los permisos para realizar esta acción",
    );
    expect(handleUnauthorized).not.toHaveBeenCalled();
  });

  it("shows the fallback message for a generic error", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useApiErrorHandler(), { wrapper });

    result.current.handleError(new Error("boom"), "Algo salió mal");

    expect(toastError).toHaveBeenCalledWith("Algo salió mal");
  });

  it("does nothing visible for a generic error without a fallback message", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useApiErrorHandler(), { wrapper });

    result.current.handleError(new Error("boom"));

    expect(toastError).not.toHaveBeenCalled();
    expect(handleUnauthorized).not.toHaveBeenCalled();
  });

  it("throwOnError delegates to handleError and returns false", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useApiErrorHandler(), { wrapper });

    const returned = result.current.throwOnError(new Error(API_ERRORS.FORBIDDEN));

    expect(returned).toBe(false);
    expect(toastError).toHaveBeenCalledWith(
      "No cuentas con los permisos para realizar esta acción",
    );
  });
});
