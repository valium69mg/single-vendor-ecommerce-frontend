import { z } from "zod";

// NOTE: unlike edit-brand.schema.ts (min(1)), the locked spec requires Material
// edit to use the SAME 3-60 character validation as creation, with no
// create/edit asymmetry. Do not "fix" this back to min(1) to match Brand.
export const editMaterialSchema = z.object({
  name: z
    .string()
    .min(3, { message: "validation.minLength" })
    .max(60, { message: "validation.maxLength" }),
});

export type EditMaterialFormValues = z.infer<typeof editMaterialSchema>;
