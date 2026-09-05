import { z } from "zod";

// Mirrors the backend `ShippingAddressDTO` field lengths exactly (column
// limits on `orders.shipping_*`): recipient/line1/line2 VARCHAR(255) capped
// here at 200 (validation.maxLength200 already exists and is stricter than
// the DB limit, which is safe — it never lets a value through that the
// backend would reject), city/state/country VARCHAR(100), postalCode
// VARCHAR(20), phone VARCHAR(30). line2 is the only optional field.
export const checkoutSchema = z.object({
  recipient: z
    .string()
    .trim()
    .min(1, { message: "validation.required" })
    .max(200, { message: "validation.maxLength200" }),

  line1: z
    .string()
    .trim()
    .min(1, { message: "validation.required" })
    .max(200, { message: "validation.maxLength200" }),

  line2: z
    .string()
    .trim()
    .max(200, { message: "validation.maxLength200" })
    .optional(),

  city: z
    .string()
    .trim()
    .min(1, { message: "validation.required" })
    .max(100, { message: "validation.maxLength100" }),

  state: z
    .string()
    .trim()
    .min(1, { message: "validation.required" })
    .max(100, { message: "validation.maxLength100" }),

  postalCode: z
    .string()
    .trim()
    .min(1, { message: "validation.required" })
    .max(20, { message: "validation.maxLength20" }),

  country: z
    .string()
    .trim()
    .min(1, { message: "validation.required" })
    .max(100, { message: "validation.maxLength100" }),

  phone: z
    .string()
    .trim()
    .min(1, { message: "validation.required" })
    .max(30, { message: "validation.maxLength30" }),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
