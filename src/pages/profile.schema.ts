import { z } from "zod";

// Colocated with the page (mirrors `checkout.schema.ts`). Field limits match the
// backend `UpdateProfileDTO` (@Size(max=80) x3 names, @Size(max=30) phone). All
// four fields are optional; an empty string is accepted and sent as-is (the
// backend treats a blank value as "clear this field").
const optionalCapped = (max: number, messageKey: string) =>
  z.string().trim().max(max, { message: messageKey }).optional().or(z.literal(""));

export const profileSchema = z.object({
  firstName: optionalCapped(80, "validation.maxLength80"),
  paternalLastName: optionalCapped(80, "validation.maxLength80"),
  maternalLastName: optionalCapped(80, "validation.maxLength80"),
  phone: optionalCapped(30, "validation.maxLength30"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
