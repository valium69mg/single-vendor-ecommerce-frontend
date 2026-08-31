import { describe, it, expect } from "vitest";
import { formatMXN } from "./format";

describe("formatMXN", () => {
  it("formats an integer amount as MXN currency", () => {
    expect(formatMXN(1250)).toBe("$1,250.00");
  });

  it("formats a fractional amount with two decimals", () => {
    expect(formatMXN(99.9)).toBe("$99.90");
  });

  it("formats zero", () => {
    expect(formatMXN(0)).toBe("$0.00");
  });
});
