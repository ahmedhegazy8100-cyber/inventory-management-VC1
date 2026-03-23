import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  sku: z.string().trim().nullable().optional(),
  quantity: z.number().int().nonnegative("Quantity must be a non-negative whole number."),
});

export const productUpdateSchema = productSchema.partial();
