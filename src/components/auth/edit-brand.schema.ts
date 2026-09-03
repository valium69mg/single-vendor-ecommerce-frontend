import { z } from "zod";

export const editBrandSchema = z.object({
  name: z
    .string()
    .min(1, { message: "validation.required" })
    .max(60, { message: "validation.maxLength" }),
});

export type EditBrandFormValues = z.infer<typeof editBrandSchema>;
