import { describe, it, expect } from "vitest";
import { editMaterialSchema } from "./edit-material.schema";

describe("editMaterialSchema", () => {
  it("accepts a name at the minimum boundary (3 chars)", () => {
    const result = editMaterialSchema.safeParse({ name: "Gol" });
    expect(result.success).toBe(true);
  });

  it("accepts a name at the maximum boundary (60 chars)", () => {
    const result = editMaterialSchema.safeParse({ name: "a".repeat(60) });
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 3 chars with the minLength key", () => {
    const result = editMaterialSchema.safeParse({ name: "Au" });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "name");
    expect(issue?.message).toBe("validation.minLength");
  });

  it("rejects a name longer than 60 chars with the maxLength key", () => {
    const result = editMaterialSchema.safeParse({ name: "a".repeat(61) });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "name");
    expect(issue?.message).toBe("validation.maxLength");
  });

  // Explicit regression guard: unlike edit-brand.schema.ts (min(1)), the spec
  // requires Material edit to share the SAME 3-60 bound as creation, with no
  // create/edit asymmetry. A 1-2 char name MUST be rejected on edit too.
  it("rejects a 1-2 char name on edit, unlike Brand's edit min(1) asymmetry", () => {
    const oneChar = editMaterialSchema.safeParse({ name: "A" });
    const twoChars = editMaterialSchema.safeParse({ name: "Au" });
    expect(oneChar.success).toBe(false);
    expect(twoChars.success).toBe(false);
  });
});
