import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useDebounce from "./useDebounce";

/**
 * Characterization spec for the shipped `useDebounce({ value, delay })` hook.
 * Uses fake timers so the `setTimeout(delay)` inside the effect is driven
 * deterministically.
 */
describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value synchronously, before any timer fires", () => {
    const { result } = renderHook(() => useDebounce({ value: "a", delay: 300 }));

    expect(result.current).toBe("a");
  });

  it("keeps the previous value until the full delay has elapsed", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce({ value, delay: 300 }),
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });
    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("second");
  });

  it("resets the pending timer when the value changes again within the delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce({ value, delay: 300 }),
      { initialProps: { value: "v0" } },
    );

    rerender({ value: "v1" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("v0");

    rerender({ value: "v2" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // 200ms after the second change is still < 300ms, and the first timer was
    // cleared, so the committed value is still the original.
    expect(result.current).toBe("v0");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("v2");
  });

  it("respects the delay argument (a larger delay defers the update longer)", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce({ value, delay }),
      { initialProps: { value: "start", delay: 1000 } },
    );

    rerender({ value: "end", delay: 1000 });
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current).toBe("start");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("end");
  });

  it("clears the pending timeout on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebounce({ value, delay: 300 }),
      { initialProps: { value: "x" } },
    );

    rerender({ value: "y" });
    const callsBefore = clearSpy.mock.calls.length;
    unmount();

    expect(clearSpy.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
