import { describe, it, expect } from "vitest";
import { checkoutSchema } from "./checkout.schema";

const VALID_ADDRESS = {
  recipient: "Jane Doe",
  line1: "Av. Reforma 123",
  line2: "Depto 4B",
  city: "CDMX",
  state: "CDMX",
  postalCode: "01000",
  country: "MX",
  phone: "5555555555",
};

describe("checkoutSchema", () => {
  it("accepts a fully populated valid address", () => {
    const result = checkoutSchema.safeParse(VALID_ADDRESS);
    expect(result.success).toBe(true);
  });

  it("accepts an address with line2 omitted (optional field)", () => {
    const withoutLine2 = {
      recipient: VALID_ADDRESS.recipient,
      line1: VALID_ADDRESS.line1,
      city: VALID_ADDRESS.city,
      state: VALID_ADDRESS.state,
      postalCode: VALID_ADDRESS.postalCode,
      country: VALID_ADDRESS.country,
      phone: VALID_ADDRESS.phone,
    };
    const result = checkoutSchema.safeParse(withoutLine2);
    expect(result.success).toBe(true);
  });

  it.each([
    "recipient",
    "line1",
    "city",
    "state",
    "postalCode",
    "country",
    "phone",
  ] as const)("rejects an empty required field: %s", (field) => {
    const result = checkoutSchema.safeParse({ ...VALID_ADDRESS, [field]: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      expect(issue?.message).toBe("validation.required");
    }
  });

  it("rejects a postalCode longer than 20 characters", () => {
    const result = checkoutSchema.safeParse({
      ...VALID_ADDRESS,
      postalCode: "1".repeat(21),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("validation.maxLength20");
    }
  });

  it("rejects a phone longer than 30 characters", () => {
    const result = checkoutSchema.safeParse({
      ...VALID_ADDRESS,
      phone: "1".repeat(31),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("validation.maxLength30");
    }
  });

  it("rejects a recipient longer than 200 characters", () => {
    const result = checkoutSchema.safeParse({
      ...VALID_ADDRESS,
      recipient: "a".repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("validation.maxLength200");
    }
  });

  it("accepts a postalCode at exactly the 20-character boundary", () => {
    const result = checkoutSchema.safeParse({
      ...VALID_ADDRESS,
      postalCode: "1".repeat(20),
    });
    expect(result.success).toBe(true);
  });
});
