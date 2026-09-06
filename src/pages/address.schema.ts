import { z } from "zod";

// Colocated with the page (mirrors `checkout.schema.ts` / `profile.schema.ts`).
// Field limits match the backend `AddressRequestDTO`. `postalCode` carries the
// same hard `\d{5}` rule the backend enforces with `@Pattern`. `city` /
// `interiorNumber` / `referenceNotes` are the only optional fields.
const required = (max: number, maxKey: string) =>
  z
    .string()
    .trim()
    .min(1, { message: "validation.required" })
    .max(max, { message: maxKey });

const optional = (max: number, maxKey: string) =>
  z.string().trim().max(max, { message: maxKey }).optional().or(z.literal(""));

export const addressSchema = z.object({
  street: required(150, "validation.maxLength150"),
  exteriorNumber: required(20, "validation.maxLength20"),
  interiorNumber: optional(20, "validation.maxLength20"),
  recipientName: required(120, "validation.maxLength120"),
  phone: required(30, "validation.maxLength30"),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, { message: "validation.postalCode" }),
  state: required(120, "validation.maxLength120"),
  municipality: required(120, "validation.maxLength120"),
  city: optional(120, "validation.maxLength120"),
  neighborhood: required(120, "validation.maxLength120"),
  referenceNotes: optional(500, "validation.maxLength500"),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
