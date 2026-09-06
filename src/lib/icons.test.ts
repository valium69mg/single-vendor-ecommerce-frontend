import { describe, expect, it } from "vitest";

import { ICON, ICON_WEIGHT } from "./icons";

describe("ICON size constant", () => {
  it("exposes exactly the closed size scale from FRONTEND-STANDARD §3.11", () => {
    expect(ICON).toEqual({ sm: 16, md: 20, lg: 24, xl: 32, "2xl": 48 });
  });

  it("defaults the icon weight to regular", () => {
    expect(ICON_WEIGHT).toBe("regular");
  });
});
