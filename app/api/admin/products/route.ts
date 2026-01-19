import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminService } from "@/services/admin.service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validação para criação de produto
const createProductSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().optional(),
  description: z.string().default(""),
  basePrice: z.number().positive("Preço deve ser maior que zero"),
  compareAtPrice: z.number().nullable().optional(),
  stock: z.number().int().min(0).default(0),
  lowStockAlert: z.number().int().min(0).default(5),
  loyaltyPoints: z.number().int().min(0).default(0),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "DISCONTINUED"]).default("DRAFT"),
  isPublished: z.boolean().default(false),
  categoryId: z.string().uuid("Categoria inválida"),
  images: z.array(z.object({
    url: z.string().url("URL inválida"),
    altText: z.string().nullable().optional(),
    displayOrder: z.number().int().default(0),
    isPrimary: z.boolean().default(false),
  })).default([]),
});

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
 * GET /api/admin/products
 * Lista produtos com paginação
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const search = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const status = searchParams.get("status") as any || undefined;

  try {
    const result = await adminService.getProducts({
      page,
      pageSize,
      search,
      categoryId,
      status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Cria novo produto
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const body = await request.json();
    const validated = createProductSchema.parse(body);

    // Generate slug if not provided
    const slug = validated.slug || validated.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Check if slug exists
    const existingSlug = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "Já existe um produto com este slug" },
        { status: 400 }
      );
    }

    // Create product with images
    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description,
        basePrice: validated.basePrice,
        compareAtPrice: validated.compareAtPrice,
        stock: validated.stock,
        lowStockAlert: validated.lowStockAlert,
        loyaltyPoints: validated.loyaltyPoints,
        status: validated.status,
        isPublished: validated.isPublished,
        categoryId: validated.categoryId,
        images: {
          create: validated.images.map((img, index) => ({
            url: img.url,
            altText: img.altText || null,
            displayOrder: img.displayOrder ?? index,
            isPrimary: img.isPrimary ?? index === 0,
          })),
        },
      },
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    );
  }
}
