import { describe, it, expect } from "vitest";
import { loginSchema } from "./login.schema";

describe("loginSchema", () => {
  it("accepts a valid email + non-empty password pair", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret12",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email with the invalidEmail i18n key", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret12",
    });
    expect(result.success).toBe(false);
    const emailIssue = result.error?.issues.find((i) => i.path[0] === "email");
    expect(emailIssue?.message).toBe("validation.invalidEmail");
  });

  it("rejects an empty password with the required i18n key", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    const passwordIssue = result.error?.issues.find(
      (i) => i.path[0] === "password",
    );
    expect(passwordIssue?.message).toBe("validation.required");
  });
});
