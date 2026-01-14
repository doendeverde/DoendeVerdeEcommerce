/**
 * Product Service Layer
 *
 * Transforms Prisma data into domain types and adds business logic.
 * Uses helper functions from types/product.ts for transformations.
 */

import { productRepository, categoryRepository } from '@/repositories';
import {
  type ProductFilters,
  type ProductListItem,
  type ProductDetail,
  type PaginatedProducts,
  type CategoryItem,
  type ProductWithRelations,
  toProductListItem,
  computeDiscountPercentage,
} from '@/types/product';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ProductsWithCategories {
  products: ProductListItem[];
  categories: CategoryItem[];
  pagination: PaginatedProducts['pagination'];
}

// ─────────────────────────────────────────────────────────────────────────────
// Transform Functions
// ─────────────────────────────────────────────────────────────────────────────

function transformToDetail(product: ProductWithRelations): ProductDetail {
  const listItem = toProductListItem(product);

  return {
    ...listItem,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      displayOrder: img.displayOrder,
      isPrimary: img.isPrimary,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: v.price ? Number(v.price) : null,
      stock: v.stock,
      active: v.active,
    })),
    relatedProducts: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get paginated and filtered products with computed fields
 */
async function getProducts(filters: ProductFilters): Promise<PaginatedProducts> {
  const result = await productRepository.findMany(filters);

  const products = result.products.map(toProductListItem);

  return {
    products,
    pagination: {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
      hasMore: result.pagination.hasMore,
    },
  };
}

/**
 * Get products with active categories for filtering UI
 */
async function getProductsWithCategories(
  filters: ProductFilters
): Promise<ProductsWithCategories> {
  const [productsResult, categories] = await Promise.all([
    getProducts(filters),
    categoryRepository.findActive(),
  ]);

  const categoryItems: CategoryItem[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
    productCount: cat._count.products,
  }));

  return {
    products: productsResult.products,
    categories: categoryItems,
    pagination: productsResult.pagination,
  };
}

/**
 * Get single product by slug with full details
 */
async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await productRepository.findBySlug(slug);

  if (!product) {
    return null;
  }

  const detail = transformToDetail(product);

  // Get related products
  const relatedProducts = await getRelatedProducts(product.id, product.categoryId, 4);
  detail.relatedProducts = relatedProducts;

  return detail;
}

/**
 * Get related products (same category, excluding current)
 */
async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4
): Promise<ProductListItem[]> {
  const products = await productRepository.findRelated(productId, categoryId, limit);
  return products.map(toProductListItem);
}

/**
 * Get featured products for home page
 */
async function getFeaturedProducts(limit = 8): Promise<ProductListItem[]> {
  const result = await productRepository.findMany({
    limit,
    sortBy: 'newest',
  });

  return result.products.map(toProductListItem);
}

/**
 * Check if product has enough stock for requested quantity
 */
async function checkStock(
  productId: string,
  requestedQuantity: number
): Promise<{ available: boolean; currentStock: number }> {
  const product = await productRepository.findById(productId);

  if (!product) {
    return { available: false, currentStock: 0 };
  }

  return {
    available: product.stock >= requestedQuantity,
    currentStock: product.stock,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export const productService = {
  getProducts,
  getProductsWithCategories,
  getProductBySlug,
  getRelatedProducts,
  getFeaturedProducts,
  checkStock,
};
