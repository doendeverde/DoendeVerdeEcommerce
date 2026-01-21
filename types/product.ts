import type { Prisma } from "@prisma/client";

/**
 * Product Types for Frontend
 *
 * Tipos derivados do Prisma com campos computados para uso no frontend.
 * Separados do schema do banco para permitir evolução independente.
 * 
 * REGRA DE NEGÓCIO IMPORTANTE:
 * - Produto tem apenas basePrice (preço fixo)
 * - Desconto NÃO é do produto, é da ASSINATURA
 * - Campos de desconto (finalPrice, discountPercent, etc) são calculados
 *   server-side baseado na assinatura ativa do usuário
 */

// Product with all relations loaded
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
    variants: true;
  };
}>;

// Product for list/grid display (minimal data)
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Preço base fixo do produto (único preço do produto) */
  basePrice: number;
  // loyaltyPoints: number; // FEATURE DISABLED: Will be implemented in the future
  stock: number;
  lowStockAlert: number;
  status: string;
  isPublished: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  primaryImage: {
    url: string;
    altText: string | null;
  } | null;
  // Computed fields
  isLowStock: boolean;
  isOutOfStock: boolean;
  
  // Campos de desconto de ASSINATURA (opcionais, preenchidos quando usuário tem assinatura)
  /** Preço final com desconto de assinatura aplicado */
  finalPrice?: number;
  /** Percentual de desconto da assinatura (0-100) */
  subscriptionDiscountPercent?: number;
  /** Se o usuário atual tem desconto de assinatura */
  hasSubscriptionDiscount?: boolean;
  /** Label do desconto (ex: "Desconto Doende Bronze") */
  subscriptionDiscountLabel?: string | null;
}

// Product for detail page (full data)
export interface ProductDetail extends ProductListItem {
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    displayOrder: number;
    isPrimary: boolean;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    name: string;
    price: number | null;
    stock: number;
    active: boolean;
  }>;
  relatedProducts: ProductListItem[];
}

// Filter parameters for product listing
export interface ProductFilters {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: "relevance" | "price_asc" | "price_desc" | "newest";
  page?: number;
  limit?: number;
}

// Paginated response
export interface PaginatedProducts {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Category for filters
export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount?: number;
}

// Alias for backward compatibility
export type CategoryWithCount = CategoryItem;

/**
 * Helper function to transform Prisma product to ProductListItem
 * 
 * NOTA: Esta função NÃO calcula desconto de assinatura.
 * Para obter preços com desconto de assinatura, use lib/pricing.ts
 */
export function toProductListItem(
  product: ProductWithRelations
): ProductListItem {
  const basePrice = Number(product.basePrice);

  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice,
    // loyaltyPoints: product.loyaltyPoints, // FEATURE DISABLED: Will be implemented in the future
    stock: product.stock,
    lowStockAlert: product.lowStockAlert,
    status: product.status,
    isPublished: product.isPublished,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    primaryImage: primaryImage
      ? { url: primaryImage.url, altText: primaryImage.altText }
      : null,
    isLowStock: product.stock > 0 && product.stock <= product.lowStockAlert,
    isOutOfStock: product.stock === 0,
    // Campos de assinatura não são preenchidos aqui - usar lib/pricing.ts
    hasSubscriptionDiscount: false,
  };
}

