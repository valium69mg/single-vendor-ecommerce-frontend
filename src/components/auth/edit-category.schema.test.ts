import { describe, it, expect } from "vitest";
import { editCategorySchema } from "./edit-category.schema";

describe("editCategorySchema", () => {
  it("accepts a single-character name (min(1), asymmetric with create's min(3))", () => {
    const result = editCategorySchema.safeParse({ name: "A" });
    expect(result.success).toBe(true);
  });

  it("accepts a name at the maximum boundary (60 chars)", () => {
    const result = editCategorySchema.safeParse({ name: "a".repeat(60) });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name with the required key", () => {
    const result = editCategorySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "name");
    expect(issue?.message).toBe("validation.required");
  });

  it("rejects a name longer than 60 chars with the maxLength key", () => {
    const result = editCategorySchema.safeParse({ name: "a".repeat(61) });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "name");
    expect(issue?.message).toBe("validation.maxLength");
  });
});
