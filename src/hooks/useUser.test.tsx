import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { UserProvider } from "@/providers/UserProvider";
import { useUser } from "./useUser";
import type { LoginResponse } from "@/api/api";

const session: LoginResponse = {
  userId: "u1",
  email: "a@b.c",
  name: "Ada",
  token: "jwt-123",
  role: "USER",
};

beforeEach(() => localStorage.clear());

describe("useUser", () => {
  it("throws when used outside a UserProvider", () => {
    expect(() => renderHook(() => useUser())).toThrow(
      "useUser must be used within a UserProvider",
    );
  });

  it("exposes the context value inside a UserProvider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <UserProvider>{children}</UserProvider>
    );
    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.user).toBeNull();
    act(() => result.current.setUser(session));
    expect(result.current.user).toEqual(session);
  });
});
