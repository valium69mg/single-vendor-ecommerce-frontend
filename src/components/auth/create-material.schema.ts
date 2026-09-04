import { z } from "zod";

export const createMaterialSchema = z.object({
  name: z
    .string()
    .min(3, { message: "validation.minLength" })
    .max(60, { message: "validation.maxLength" }),
});

export type CreateMaterialFormValues = z.infer<typeof createMaterialSchema>;
