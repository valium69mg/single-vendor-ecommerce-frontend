import { z } from "zod";

export const createBrandSchema = z.object({
  name: z
    .string()
    .min(3, { message: "validation.minLength" })
    .max(60, { message: "validation.maxLength" }),
});

export type CreateBrandFormValues = z.infer<typeof createBrandSchema>;
