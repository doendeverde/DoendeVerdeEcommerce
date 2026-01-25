/**
 * Admin Benefits API
 *
 * GET  /api/admin/benefits - List all benefits
 * POST /api/admin/benefits - Create a new benefit
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as benefitService from '@/services/benefit.service';
import { createBenefitSchema, benefitQuerySchema } from '@/schemas/benefit.schema';

/**
 * GET /api/admin/benefits
 * List all benefits with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const queryResult = benefitQuerySchema.safeParse({
      isActive: searchParams.get('isActive'),
      orderBy: searchParams.get('orderBy'),
      orderDir: searchParams.get('orderDir'),
    });

    const query = queryResult.success ? queryResult.data : { isActive: undefined, orderBy: 'displayOrder' as const, orderDir: 'asc' as const };

    const result = await benefitService.listBenefits({
      isActive: query.isActive,
      orderBy: query.orderBy,
      orderDir: query.orderDir,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/admin/benefits]', error);
    return NextResponse.json(
      { error: 'Erro ao listar benefícios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/benefits
 * Create a new benefit
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const validation = createBenefitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const benefit = await benefitService.createBenefit(validation.data);

    return NextResponse.json(benefit, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/benefits]', error);

    if (error instanceof Error && error.message.includes('slug')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Erro ao criar benefício' },
      { status: 500 }
    );
  }
}
