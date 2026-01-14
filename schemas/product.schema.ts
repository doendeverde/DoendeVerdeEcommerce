import { z } from "zod";

/**
 * Product Schemas — Zod validation
 *
 * Schemas para validação de parâmetros de busca e filtros de produtos.
 */

// Query params for product listing
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  categorySlug: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  onSale: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["relevance", "price_asc", "price_desc", "newest"])
    .optional()
    .default("relevance"),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(12),
});

export type ProductFiltersInput = z.infer<typeof productFiltersSchema>;

// Slug param for single product
export const productSlugSchema = z.object({
  slug: z.string().min(1, "Slug é obrigatório"),
});

export type ProductSlugInput = z.infer<typeof productSlugSchema>;
