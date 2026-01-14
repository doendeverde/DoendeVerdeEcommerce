import { prisma } from "@/lib/prisma";

/**
 * Category Repository
 *
 * Queries simples para categorias.
 */

export const categoryRepository = {
  /**
   * Find all active categories ordered by displayOrder
   */
  async findActive() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  /**
   * Find category by slug
   */
  async findBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug, isActive: true },
    });
  },
};
