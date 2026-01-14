import type { Prisma } from "@prisma/client";

/**
 * Product Types for Frontend
 *
 * Tipos derivados do Prisma com campos computados para uso no frontend.
 * Separados do schema do banco para permitir evolução independente.
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
  basePrice: number;
  compareAtPrice: number | null;
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
  discountPercentage: number;
  isLowStock: boolean;
  isOnSale: boolean;
  isOutOfStock: boolean;
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
  onSale?: boolean;
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
 * Helper function to compute discount percentage
 */
export function computeDiscountPercentage(
  basePrice: number,
  compareAtPrice: number | null
): number {
  if (!compareAtPrice || compareAtPrice <= basePrice) return 0;
  return Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100);
}

/**
 * Helper function to transform Prisma product to ProductListItem
 */
export function toProductListItem(
  product: ProductWithRelations
): ProductListItem {
  const basePrice = Number(product.basePrice);
  const compareAtPrice = product.compareAtPrice
    ? Number(product.compareAtPrice)
    : null;

  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice,
    compareAtPrice,
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
    discountPercentage: computeDiscountPercentage(basePrice, compareAtPrice),
    isLowStock: product.stock > 0 && product.stock <= product.lowStockAlert,
    isOnSale: compareAtPrice !== null && compareAtPrice > basePrice,
    isOutOfStock: product.stock === 0,
  };
}
