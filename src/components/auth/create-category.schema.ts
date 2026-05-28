import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(3, { message: "validation.minLength" })
    .max(60, { message: "validation.maxLength" }),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;
