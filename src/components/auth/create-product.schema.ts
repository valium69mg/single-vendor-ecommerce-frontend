import { z } from "zod";

const variantSchema = z.object({
  sku: z.string().min(1, "validation.required").max(100, "validation.maxLength100"),
  price: z
    .number({ message: "validation.required" })
    .min(0.01, "validation.minPrice"),
  discountPrice: z
    .number()
    .min(0.01, "validation.minPrice")
    .nullable()
    .optional(),
  stock: z
    .number({ message: "validation.required" })
    .int()
    .min(0, "validation.minStock"),
  weightGrams: z.number().int().min(1, "validation.minWeight").nullable().optional(),
  attributeValueIds: z.array(z.number()),
});

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "validation.required")
    .max(200, "validation.maxLength200"),
  shortDescription: z.string().max(500, "validation.maxLength500").optional(),
  longDescription: z.string().max(5000, "validation.maxLength5000").optional(),
  featured: z.boolean(),
  brandId: z.number().nullable().optional(),
  categoryId: z.number().nullable().optional(),
  materialIds: z.array(z.number()),
  variants: z.array(variantSchema).min(1, "validation.minOneVariant"),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type CreateProductVariantValues = z.infer<typeof variantSchema>;
