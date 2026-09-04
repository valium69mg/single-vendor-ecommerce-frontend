import { z } from "zod";

// Mirrors the backend `CreateUserDTO` password policy exactly:
// 8-64 chars, at least one upper, one lower, one digit, one special
// character (`@$!%*?&`). Keep in sync with `CreateUserDTO.java`.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).*$/;

export const registerSchema = z
  .object({
    email: z.email({ message: "validation.invalidEmail" }),

    password: z
      .string()
      .min(8, { message: "validation.passwordMin" })
      .max(64, { message: "validation.passwordMax" })
      .regex(PASSWORD_PATTERN, { message: "validation.passwordPattern" }),

    confirmPassword: z.string().min(1, { message: "validation.required" }),

    acceptTerms: z.literal(true, {
      message: "auth.register.termsRequired",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "auth.register.passwordMismatch",
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
