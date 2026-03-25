import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  sku: z.string().trim().nullable().optional(),
  barcode: z.string().trim().nullable().optional(),
  quantity: z.number().int().nonnegative("Quantity must be a non-negative whole number."),
  price: z.number().nonnegative("Price must be a non-negative number.").default(0),
  purchasePrice: z.number().nonnegative("Purchase price must be a non-negative number.").default(0),
  expiryDate: z.coerce.date().nullable().optional(),
  batchNumber: z.string().trim().nullable().optional(),
  targetQuantity: z.number().int().positive("Target quantity must be a positive number.").default(100),
});


export const productUpdateSchema = productSchema.partial();
