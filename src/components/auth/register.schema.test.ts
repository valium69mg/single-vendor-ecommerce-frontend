import { describe, it, expect } from "vitest";
import { registerSchema } from "./register.schema";

const validPassword = "Secret12!";

function base(overrides: Record<string, unknown> = {}) {
  return {
    email: "user@example.com",
    password: validPassword,
    confirmPassword: validPassword,
    acceptTerms: true,
    ...overrides,
  };
}

describe("registerSchema", () => {
  it("accepts a fully valid payload", () => {
    const result = registerSchema.safeParse(base());
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email with the invalidEmail i18n key", () => {
    const result = registerSchema.safeParse(base({ email: "not-an-email" }));
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "email");
    expect(issue?.message).toBe("validation.invalidEmail");
  });

  it("rejects a password shorter than 8 chars with the passwordMin key", () => {
    const result = registerSchema.safeParse(
      base({ password: "Ab1!", confirmPassword: "Ab1!" }),
    );
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "password");
    expect(issue?.message).toBe("validation.passwordMin");
  });

  it("rejects a password longer than 64 chars with the passwordMax key", () => {
    const long = "Aa1!".repeat(17); // 68 chars
    const result = registerSchema.safeParse(
      base({ password: long, confirmPassword: long }),
    );
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "password");
    expect(issue?.message).toBe("validation.passwordMax");
  });

  it("rejects a password missing an uppercase letter with the passwordPattern key", () => {
    const result = registerSchema.safeParse(
      base({ password: "secret12!", confirmPassword: "secret12!" }),
    );
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "password");
    expect(issue?.message).toBe("validation.passwordPattern");
  });

  it("rejects a password missing a lowercase letter with the passwordPattern key", () => {
    const result = registerSchema.safeParse(
      base({ password: "SECRET12!", confirmPassword: "SECRET12!" }),
    );
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "password");
    expect(issue?.message).toBe("validation.passwordPattern");
  });

  it("rejects a password missing a digit with the passwordPattern key", () => {
    const result = registerSchema.safeParse(
      base({ password: "Secretaa!", confirmPassword: "Secretaa!" }),
    );
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "password");
    expect(issue?.message).toBe("validation.passwordPattern");
  });

  it("rejects a password missing a special character with the passwordPattern key", () => {
    const result = registerSchema.safeParse(
      base({ password: "Secret123", confirmPassword: "Secret123" }),
    );
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "password");
    expect(issue?.message).toBe("validation.passwordPattern");
  });

  it("rejects a confirmPassword mismatch with the passwordMismatch key on that path", () => {
    const result = registerSchema.safeParse(
      base({ confirmPassword: "Different12!" }),
    );
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find(
      (i) => i.path[0] === "confirmPassword",
    );
    expect(issue?.message).toBe("auth.register.passwordMismatch");
  });

  it("rejects an unchecked terms checkbox with the termsRequired key", () => {
    const result = registerSchema.safeParse(base({ acceptTerms: false }));
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find(
      (i) => i.path[0] === "acceptTerms",
    );
    expect(issue?.message).toBe("auth.register.termsRequired");
  });
});
