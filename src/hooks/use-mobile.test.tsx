import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { stubMatchMedia } from "@/test/adminFormHelpers";
import { useIsMobile } from "./use-mobile";

/**
 * Characterization spec for the shipped `useIsMobile()` hook. jsdom does not
 * implement `window.matchMedia`, so the helper `stubMatchMedia()` provides a
 * controllable stub whose `addEventListener`/`removeEventListener` are spies.
 * The hook derives its boolean from `window.innerWidth`, not `mql.matches`.
 */
function setInnerWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

describe("useIsMobile", () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setInnerWidth(originalWidth);
  });

  it("returns true when the viewport is below the 768px breakpoint", () => {
    stubMatchMedia(true);
    setInnerWidth(500);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("returns false when the viewport is at or above the 768px breakpoint", () => {
    stubMatchMedia(false);
    setInnerWidth(768);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("subscribes to the media-query 'change' event and reacts to it", () => {
    const mql = stubMatchMedia(false);
    setInnerWidth(1024);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    expect(mql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    const onChange = mql.addEventListener.mock.calls[0][1] as () => void;

    act(() => {
      setInnerWidth(400);
      onChange();
    });

    expect(result.current).toBe(true);
  });

  it("removes its 'change' listener on unmount", () => {
    const mql = stubMatchMedia(false);
    setInnerWidth(1024);

    const { unmount } = renderHook(() => useIsMobile());
    const registered = mql.addEventListener.mock.calls[0][1];

    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith("change", registered);
  });
});
