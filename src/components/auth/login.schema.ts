import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email({ message: "validation.invalidEmail" }),

  password: z
    .string()
});

export type LoginFormValues = z.infer<typeof loginSchema>;
