/**
 * Plan Benefits API
 *
 * GET /api/admin/subscriptions/[planId]/benefits - Get benefits for a plan (admin)
 * PUT /api/admin/subscriptions/[planId]/benefits - Update benefits for a plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as benefitService from '@/services/benefit.service';
import { updatePlanBenefitsSchema } from '@/schemas/benefit.schema';

interface RouteParams {
  params: Promise<{ planId: string }>;
}

/**
 * GET /api/admin/subscriptions/[planId]/benefits
 * Get all benefits for a subscription plan
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { planId } = await params;

    // Auth check
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const result = await benefitService.getPlanBenefits(planId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/admin/subscriptions/[planId]/benefits]', error);

    if (error instanceof Error && error.message.includes('não encontrado')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Erro ao buscar benefícios do plano' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/subscriptions/[planId]/benefits
 * Update benefits for a subscription plan
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { planId } = await params;

    // Auth check
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const validation = updatePlanBenefitsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const result = await benefitService.updatePlanBenefits(planId, validation.data.benefits);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[PUT /api/admin/subscriptions/[planId]/benefits]', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar benefícios do plano' },
      { status: 500 }
    );
  }
}
