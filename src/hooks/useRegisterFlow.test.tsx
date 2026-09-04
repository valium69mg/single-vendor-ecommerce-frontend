import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, loginRequest: vi.fn() };
});

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import type { LoginResponse } from "@/api/api";
import { useRegisterFlow } from "./useRegisterFlow";

const mockedUseUser = vi.mocked(useUser);
const setUser = vi.fn();

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseUser.mockReturnValue({ user: null, setUser, logout: vi.fn() });
});

describe("useRegisterFlow", () => {
  it("logs in with the given credentials and sets the user", async () => {
    const response: LoginResponse = {
      userId: "u1",
      email: "user@example.com",
      name: "Ada",
      token: "jwt",
      role: "USER",
      isVerified: true,
    };
    vi.mocked(api.loginRequest).mockResolvedValue(response);
    const onUnverified = vi.fn();
    const { result } = renderHook(() => useRegisterFlow({ onUnverified }), {
      wrapper: makeWrapper(),
    });

    act(() => result.current.onRegistered("user@example.com", "Secret12!"));

    await waitFor(() =>
      expect(api.loginRequest).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Secret12!",
      }),
    );
    await waitFor(() => expect(setUser).toHaveBeenCalledWith(response));
  });

  it("calls onUnverified when the background login returns isVerified: false", async () => {
    const response: LoginResponse = {
      userId: "u1",
      email: "user@example.com",
      name: "Ada",
      token: "jwt",
      role: "USER",
      isVerified: false,
    };
    vi.mocked(api.loginRequest).mockResolvedValue(response);
    const onUnverified = vi.fn();
    const { result } = renderHook(() => useRegisterFlow({ onUnverified }), {
      wrapper: makeWrapper(),
    });

    act(() => result.current.onRegistered("user@example.com", "Secret12!"));

    await waitFor(() => expect(onUnverified).toHaveBeenCalled());
  });

  it("does not call onUnverified when the background login returns isVerified: true", async () => {
    const response: LoginResponse = {
      userId: "u1",
      email: "user@example.com",
      name: "Ada",
      token: "jwt",
      role: "USER",
      isVerified: true,
    };
    vi.mocked(api.loginRequest).mockResolvedValue(response);
    const onUnverified = vi.fn();
    const { result } = renderHook(() => useRegisterFlow({ onUnverified }), {
      wrapper: makeWrapper(),
    });

    act(() => result.current.onRegistered("user@example.com", "Secret12!"));

    await waitFor(() => expect(setUser).toHaveBeenCalledWith(response));
    expect(onUnverified).not.toHaveBeenCalled();
  });
});
