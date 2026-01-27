import { prisma } from "@/lib/prisma";
import { ProductStatus, Prisma } from "@prisma/client";
import type { ProductFilters } from "@/types/product";

/**
 * Product Repository
 *
 * Isola todas as queries Prisma relacionadas a produtos.
 * Permite otimização e testes independentes da camada de negócio.
 * 
 * IMPORTANTE - SOFT DELETE:
 * Todas as queries públicas DEVEM incluir `deletedAt: null` no where.
 * Isso garante que produtos soft-deleted não apareçam em nenhuma listagem.
 * 
 * @see /docs/SOFT_DELETE.md para mais informações
 */

// Include for product with relations
const productWithRelations = {
  category: true,
  images: {
    orderBy: { displayOrder: "asc" as const },
  },
  variants: {
    where: { active: true },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.ProductInclude;

/**
 * Base where clause for public queries
 * Garante que apenas produtos ativos e não-deletados sejam retornados
 */
const publicProductWhere: Prisma.ProductWhereInput = {
  isPublished: true,
  status: ProductStatus.ACTIVE,
  deletedAt: null, // SOFT DELETE: exclui produtos deletados
};

export const productRepository = {
  /**
   * Find many products with filters, pagination and sorting
   * 
   * IMPORTANTE: Filtra automaticamente produtos soft-deleted (deletedAt != null)
   */
  async findMany(filters: ProductFilters) {
    const {
      search,
      categorySlug,
      minPrice,
      maxPrice,
      inStock,
      sortBy = "relevance",
      page = 1,
      limit = 12,
    } = filters;

    // Build where clause - começa com filtro base (inclui deletedAt: null)
    const where: Prisma.ProductWhereInput = {
      ...publicProductWhere,
    };

    // Category filter
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    // Search filter (case insensitive)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Price range filters
    if (minPrice !== undefined) {
      where.basePrice = { ...where.basePrice as object, gte: minPrice };
    }
    if (maxPrice !== undefined) {
      where.basePrice = { ...where.basePrice as object, lte: maxPrice };
    }

    // In stock filter
    if (inStock) {
      where.stock = { gt: 0 };
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    switch (sortBy) {
      case "price_asc":
        orderBy = { basePrice: "asc" };
        break;
      case "price_desc":
        orderBy = { basePrice: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "relevance":
      default:
        // For relevance, we could implement scoring but for now use newest
        orderBy = { createdAt: "desc" };
    }

    // Execute queries in parallel
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productWithRelations,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  },

  /**
   * Find single product by slug with all relations
   * 
   * IMPORTANTE: Filtra automaticamente produtos soft-deleted
   */
  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: {
        slug,
        ...publicProductWhere,
      },
      include: productWithRelations,
    });
  },

  /**
   * Find related products (same category, excluding current)
   * 
   * IMPORTANTE: Filtra automaticamente produtos soft-deleted
   */
  async findRelated(productId: string, categoryId: string, limit = 4) {
    return prisma.product.findMany({
      where: {
        categoryId,
        id: { not: productId },
        ...publicProductWhere,
      },
      include: productWithRelations,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Find product by ID (for cart operations)
   * 
   * NOTA: Esta query NÃO filtra soft-deleted porque é usada para
   * validar itens já existentes no carrinho/pedido.
   * A verificação de soft-delete deve ser feita na camada de serviço.
   */
  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: productWithRelations,
    });
  },
};
