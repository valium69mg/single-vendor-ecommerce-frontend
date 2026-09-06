import { describe, it, expect } from "vitest";
import { addressSchema } from "./address.schema";

const VALID = {
  street: "Av. Reforma",
  exteriorNumber: "123",
  interiorNumber: "4B",
  recipientName: "Ana García",
  phone: "5551234567",
  postalCode: "01000",
  state: "CDMX",
  municipality: "Cuauhtémoc",
  city: "Ciudad de México",
  neighborhood: "Centro",
  referenceNotes: "Frente al parque",
};

describe("addressSchema", () => {
  it("accepts a fully populated valid address", () => {
    expect(addressSchema.safeParse(VALID).success).toBe(true);
  });

  it("accepts empty strings for the optional fields", () => {
    const result = addressSchema.safeParse({
      ...VALID,
      interiorNumber: "",
      city: "",
      referenceNotes: "",
    });
    expect(result.success).toBe(true);
  });

  it.each(["123", "abcde", "0100", "010000", ""])(
    "rejects an invalid postalCode: %s",
    (postalCode) => {
      const result = addressSchema.safeParse({ ...VALID, postalCode });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === "postalCode");
        expect(issue?.message).toBe("validation.postalCode");
      }
    },
  );

  it("accepts a well-formed 5-digit postalCode", () => {
    expect(addressSchema.safeParse({ ...VALID, postalCode: "44100" }).success).toBe(
      true,
    );
  });

  it("rejects an over-length street", () => {
    const result = addressSchema.safeParse({ ...VALID, street: "a".repeat(151) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.find((i) => i.path[0] === "street")?.message,
      ).toBe("validation.maxLength150");
    }
  });

  it("rejects a blank required field", () => {
    const result = addressSchema.safeParse({ ...VALID, recipientName: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.find((i) => i.path[0] === "recipientName")?.message,
      ).toBe("validation.required");
    }
  });
});
