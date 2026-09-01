import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * `authHandler` keeps a module-level `isLoggingOut` flag, which would otherwise
 * leak between tests running in the same worker. Each test resets the module
 * registry and re-imports a fresh copy, and drives the scheduled `setTimeout`
 * body with fake timers.
 */
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function loadHandler() {
  return (await import("@/lib/authHandler")).handleUnauthorized;
}

describe("handleUnauthorized re-entrancy guard", () => {
  it("collapses concurrent 401s into a single logout call", async () => {
    const handleUnauthorized = await loadHandler();
    const logout = vi.fn();

    handleUnauthorized(logout);
    handleUnauthorized(logout);
    handleUnauthorized(logout);

    await vi.runAllTimersAsync();

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("resets the guard after a completed logout cycle", async () => {
    const handleUnauthorized = await loadHandler();
    const logout = vi.fn();

    handleUnauthorized(logout);
    await vi.runAllTimersAsync();

    handleUnauthorized(logout);
    await vi.runAllTimersAsync();

    expect(logout).toHaveBeenCalledTimes(2);
  });

  it("resets the guard even when logout throws in the scheduled callback", async () => {
    const handleUnauthorized = await loadHandler();
    const throwingLogout = vi.fn(() => {
      throw new Error("logout boom");
    });

    handleUnauthorized(throwingLogout);
    await expect(vi.runAllTimersAsync()).rejects.toThrow("logout boom");

    const secondLogout = vi.fn();
    handleUnauthorized(secondLogout);
    await vi.runAllTimersAsync();

    expect(secondLogout).toHaveBeenCalledTimes(1);
  });
});
