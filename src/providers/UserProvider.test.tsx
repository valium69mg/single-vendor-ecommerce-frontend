import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { UserProvider } from "./UserProvider";
import { useUser } from "@/hooks/useUser";
import type { LoginResponse } from "@/api/api";

function wrapper({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

const session: LoginResponse = {
  userId: "u1",
  email: "a@b.c",
  name: "Ada",
  token: "jwt-123",
  role: "USER",
  isVerified: true,
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("UserProvider bootstrap", () => {
  it("hydrates the user from a valid serialized session", () => {
    localStorage.setItem("loginData", JSON.stringify(session));
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.user).toEqual(session);
  });

  it("renders logged out when there is no stored session", () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it("renders logged out (no throw) when the stored session is corrupt", () => {
    localStorage.setItem("loginData", "{not json");
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.user).toBeNull();
  });
});

describe("UserProvider persistence (single source of truth)", () => {
  it("persists loginData when setUser stores an authenticated user", () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => result.current.setUser(session));
    expect(localStorage.getItem("loginData")).toBe(JSON.stringify(session));
  });

  it("removes loginData and clears the user on logout", () => {
    localStorage.setItem("loginData", JSON.stringify(session));
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => result.current.logout());
    expect(localStorage.getItem("loginData")).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
