import { z } from "zod";

export const locales = ["ru", "en"] as const;
export const localeSchema = z.enum(locales);
export type Locale = z.infer<typeof localeSchema>;

export const productStatusSchema = z.enum(["draft", "published", "archived"]);
export type ProductStatus = z.infer<typeof productStatusSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export const productQuerySchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(["new", "price_asc", "price_desc"]).default("new"),
  includeDrafts: z.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
  inStock: z.boolean().optional(),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

export function parseProductQuery(input: unknown) {
  return productQuerySchema.safeParse(input);
}
