import { describe, it, expect } from "vitest";
import { createBrandSchema } from "./create-brand.schema";

describe("createBrandSchema", () => {
  it("accepts a name at the minimum boundary (3 chars)", () => {
    const result = createBrandSchema.safeParse({ name: "Oro" });
    expect(result.success).toBe(true);
  });

  it("accepts a name at the maximum boundary (60 chars)", () => {
    const result = createBrandSchema.safeParse({ name: "a".repeat(60) });
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 3 chars with the minLength key", () => {
    const result = createBrandSchema.safeParse({ name: "Au" });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "name");
    expect(issue?.message).toBe("validation.minLength");
  });

  it("rejects a name longer than 60 chars with the maxLength key", () => {
    const result = createBrandSchema.safeParse({ name: "a".repeat(61) });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "name");
    expect(issue?.message).toBe("validation.maxLength");
  });
});
