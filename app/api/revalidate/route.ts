/**
 * On-Demand Revalidation API
 * 
 * Permite revalidar páginas específicas via API.
 * Útil para atualizar cache imediatamente após mudanças no admin.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SEGURANÇA:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * - Requer token secreto via query param ou header
 * - Token deve estar em .env como REVALIDATE_SECRET
 * - Apenas admin deve conhecer o token
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * USO:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Revalidar path específico:
 * POST /api/revalidate?secret=XXX&path=/
 * 
 * Revalidar por tag:
 * POST /api/revalidate?secret=XXX&tag=products
 * 
 * Revalidar múltiplos paths:
 * POST /api/revalidate?secret=XXX
 * Body: { "paths": ["/", "/products"] }
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * INTEGRAÇÃO COM ADMIN:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Após criar/editar/deletar produto:
 * await fetch(`/api/revalidate?secret=${REVALIDATE_SECRET}&path=/`);
 * await fetch(`/api/revalidate?secret=${REVALIDATE_SECRET}&path=/products`);
 * 
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#on-demand-revalidation
 */

import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/revalidate
 * 
 * Revalidate pages by path or tag
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação via secret token
    const secret = 
      request.nextUrl.searchParams.get("secret") ||
      request.headers.get("x-revalidate-secret");

    const expectedSecret = process.env.REVALIDATE_SECRET;

    if (!expectedSecret) {
      console.error("[Revalidate] REVALIDATE_SECRET não configurado no .env");
      return NextResponse.json(
        { 
          success: false,
          message: "Revalidation not configured on server" 
        },
        { status: 500 }
      );
    }

    if (secret !== expectedSecret) {
      console.warn("[Revalidate] Tentativa de revalidação com token inválido");
      return NextResponse.json(
        { 
          success: false,
          message: "Invalid token" 
        },
        { status: 401 }
      );
    }

    // 2. Revalidar por path (via query param)
    const pathParam = request.nextUrl.searchParams.get("path");
    if (pathParam) {
      revalidatePath(pathParam);
      console.log(`[Revalidate] ✅ Path revalidated: ${pathParam}`);
      return NextResponse.json({
        success: true,
        revalidated: true,
        path: pathParam,
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Revalidar por tag (via query param)
    const tagParam = request.nextUrl.searchParams.get("tag");
    if (tagParam) {
      revalidateTag(tagParam, "");
      console.log(`[Revalidate] ✅ Tag revalidated: ${tagParam}`);
      return NextResponse.json({
        success: true,
        revalidated: true,
        tag: tagParam,
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Revalidar múltiplos paths (via body)
    const body = await request.json().catch(() => null);
    
    if (body?.paths && Array.isArray(body.paths)) {
      const revalidated: string[] = [];
      
      for (const path of body.paths) {
        revalidatePath(path);
        revalidated.push(path);
      }

      console.log(`[Revalidate] ✅ Multiple paths revalidated: ${revalidated.join(", ")}`);
      
      return NextResponse.json({
        success: true,
        revalidated: true,
        paths: revalidated,
        timestamp: new Date().toISOString(),
      });
    }

    // 5. Revalidar múltiplas tags (via body)
    if (body?.tags && Array.isArray(body.tags)) {
      const revalidated: string[] = [];
      
      for (const tag of body.tags) {
        revalidateTag(tag, "");
        revalidated.push(tag);
      }

      console.log(`[Revalidate] ✅ Multiple tags revalidated: ${revalidated.join(", ")}`);
      
      return NextResponse.json({
        success: true,
        revalidated: true,
        tags: revalidated,
        timestamp: new Date().toISOString(),
      });
    }

    // 6. Nenhum parâmetro válido fornecido
    return NextResponse.json(
      {
        success: false,
        message: "Missing path or tag parameter. Use ?path=/your-path or ?tag=your-tag",
      },
      { status: 400 }
    );

  } catch (error) {
    console.error("[Revalidate] Error:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/revalidate
 * 
 * Health check endpoint
 */
export async function GET() {
  const hasSecret = !!process.env.REVALIDATE_SECRET;
  
  return NextResponse.json({
    service: "On-Demand Revalidation API",
    status: "online",
    configured: hasSecret,
    hint: hasSecret 
      ? "Use POST with ?secret=XXX&path=/your-path"
      : "Set REVALIDATE_SECRET in .env to enable",
  });
}
