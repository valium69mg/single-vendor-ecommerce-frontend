import { describe, it, expect } from "vitest";
import { profileSchema } from "./profile.schema";

const VALID = {
  firstName: "Ana",
  paternalLastName: "García",
  maternalLastName: "López",
  phone: "5551234567",
};

describe("profileSchema", () => {
  it("accepts a fully populated valid profile", () => {
    expect(profileSchema.safeParse(VALID).success).toBe(true);
  });

  it("accepts empty strings for every optional field", () => {
    const result = profileSchema.safeParse({
      firstName: "",
      paternalLastName: "",
      maternalLastName: "",
      phone: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an object with all fields omitted", () => {
    expect(profileSchema.safeParse({}).success).toBe(true);
  });

  it.each([
    ["firstName", "a".repeat(81), "validation.maxLength80"],
    ["paternalLastName", "b".repeat(81), "validation.maxLength80"],
    ["maternalLastName", "c".repeat(81), "validation.maxLength80"],
    ["phone", "9".repeat(31), "validation.maxLength30"],
  ] as const)("rejects over-length %s", (field, value, messageKey) => {
    const result = profileSchema.safeParse({ ...VALID, [field]: value });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      expect(issue?.message).toBe(messageKey);
    }
  });

  it("accepts a name at exactly the 80-character boundary", () => {
    expect(
      profileSchema.safeParse({ ...VALID, firstName: "x".repeat(80) }).success,
    ).toBe(true);
  });
});
