import { z } from "zod";

export const editCategorySchema = z.object({
  spanishName: z
    .string()
    .min(1, { message: "validation.required" }) 
    .max(60, { message: "validation.maxLength" }),
  englishName: z
    .string()
    .min(1, { message: "validation.required" }) 
    .max(60, { message: "validation.maxLength" }) 
});

export type EditCategoryFormValues = z.infer<typeof editCategorySchema>