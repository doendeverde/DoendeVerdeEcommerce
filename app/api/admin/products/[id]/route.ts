import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/services/admin.service";
import { prisma } from "@/lib/prisma";
import { revalidateProductPages } from "@/lib/revalidate";
import { z } from "zod";

// Schema de validação para atualização de produto
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "DISCONTINUED"]).optional(),
  isPublished: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  shippingProfileId: z.string().uuid().nullable().optional(),
  images: z.array(z.object({
    url: z.string().url("URL inválida"),
    altText: z.string().nullable().optional(),
    displayOrder: z.number().int().default(0),
    isPrimary: z.boolean().default(false),
  })).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Verifica se o usuário é admin
 */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: "Não autenticado", status: 401 };
  }
  if (session.user.role !== "ADMIN") {
    return { error: "Acesso negado", status: 403 };
  }
  return { user: session.user };
}

/**
 * GET /api/admin/products/[id]
 * Busca produto por ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const { id } = await params;

  try {
    const product = await adminService.getProductById(id);

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/products/[id]
 * Atualiza produto
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    
    // Log detalhado para debug
    console.log(`[PUT /api/admin/products/${id}] Payload recebido:`, JSON.stringify(body, null, 2));
    
    const validated = updateProductSchema.parse(body);
    
    console.log(`[PUT /api/admin/products/${id}] Dados validados:`, JSON.stringify(validated, null, 2));

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changed
    if (validated.slug && validated.slug !== existing.slug) {
      const slugExists = await prisma.product.findFirst({
        where: {
          slug: validated.slug,
          id: { not: id },
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "Já existe um produto com este slug" },
          { status: 400 }
        );
      }
    }

    // Update product
    const updateData: any = { ...validated };
    delete updateData.images;

    // Handle images separately
    if (validated.images !== undefined) {
      // Delete old images
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });

      // Create new images
      if (validated.images.length > 0) {
        await prisma.productImage.createMany({
          data: validated.images.map((img, index) => ({
            productId: id,
            url: img.url,
            altText: img.altText || null,
            displayOrder: img.displayOrder ?? index,
            isPrimary: img.isPrimary ?? index === 0,
          })),
        });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[PUT /api/admin/products/${id}] Erro de validação Zod:`, JSON.stringify(error.issues, null, 2));
      return NextResponse.json(
        { 
          error: "Dados inválidos", 
          details: error.issues,
          message: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
        },
        { status: 400 }
      );
    }
    console.error(`[PUT /api/admin/products/${id}] Erro ao atualizar produto:`, error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]
 * 
 * SOFT DELETE de produto.
 * 
 * Por que SOFT DELETE?
 * - Produtos podem ter referências em OrderItem (pedidos históricos)
 * - Hard delete causaria erro de FK ou perda de dados
 * - Mantém integridade do histórico de pedidos
 * 
 * O que acontece:
 * 1. Marca deletedAt com timestamp atual
 * 2. Revalida cache de páginas públicas
 * 3. Produto deixa de aparecer em listagens/busca
 * 4. Pedidos existentes continuam funcionando
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { 
        id: true, 
        slug: true, 
        name: true,
        deletedAt: true,
        _count: {
          select: { orderItems: true }
        }
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Já está soft-deleted?
    if (product.deletedAt) {
      return NextResponse.json(
        { error: "Produto já está desativado" },
        { status: 400 }
      );
    }

    // Soft delete: marca deletedAt ao invés de excluir
    await prisma.product.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        // Também marca como não publicado para garantir
        isPublished: false,
      },
    });

    // Revalidar cache das páginas que listam produtos
    // Isso garante que o produto soft-deleted não apareça mais
    await revalidateProductPages(product.slug);

    return NextResponse.json({ 
      success: true,
      message: `Produto "${product.name}" desativado com sucesso`,
      hadOrders: product._count.orderItems > 0,
    });
  } catch (error) {
    console.error("[DELETE /api/admin/products] Error:", error);
    return NextResponse.json(
      { error: "Erro ao desativar produto" },
      { status: 500 }
    );
  }
}
