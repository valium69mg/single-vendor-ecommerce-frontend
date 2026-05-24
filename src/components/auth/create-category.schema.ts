import { z } from "zod";

export const createCategorySchema = z.object({
  englishName: z
    .string()
    .min(3, { message: "validation.minLength" })
    .max(60, { message: "validation.maxLength" }),
  spanishName: z
    .string()
    .min(3, { message: "validation.minLength" })
    .max(60, { message: "validation.maxLength" }),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;
