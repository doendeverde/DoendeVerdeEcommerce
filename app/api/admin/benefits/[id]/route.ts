/**
 * Admin Benefit Detail API
 *
 * GET    /api/admin/benefits/[id] - Get benefit details
 * PUT    /api/admin/benefits/[id] - Update benefit
 * DELETE /api/admin/benefits/[id] - Delete benefit
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as benefitService from '@/services/benefit.service';
import { updateBenefitSchema } from '@/schemas/benefit.schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/benefits/[id]
 * Get benefit details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Auth check
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const benefit = await benefitService.getBenefitById(id, true);

    if (!benefit) {
      return NextResponse.json({ error: 'Benefício não encontrado' }, { status: 404 });
    }

    return NextResponse.json(benefit);
  } catch (error) {
    console.error('[GET /api/admin/benefits/[id]]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar benefício' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/benefits/[id]
 * Update benefit
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Auth check
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const validation = updateBenefitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const benefit = await benefitService.updateBenefit(id, validation.data);

    return NextResponse.json(benefit);
  } catch (error) {
    console.error('[PUT /api/admin/benefits/[id]]', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('slug')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar benefício' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/benefits/[id]
 * Delete benefit
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Auth check
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await benefitService.deleteBenefit(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/benefits/[id]]', error);

    if (error instanceof Error && error.message.includes('não encontrado')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Erro ao excluir benefício' },
      { status: 500 }
    );
  }
}
