/**
 * Public Plan Benefits API
 *
 * GET /api/plans/[planId]/benefits - Get enabled benefits for a plan (public)
 */

import { NextRequest, NextResponse } from 'next/server';
import * as benefitService from '@/services/benefit.service';

interface RouteParams {
  params: Promise<{ planId: string }>;
}

/**
 * GET /api/plans/[planId]/benefits
 * Get enabled benefits for a subscription plan (public endpoint)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { planId } = await params;

    const benefits = await benefitService.getEnabledPlanBenefits(planId);

    return NextResponse.json({ benefits });
  } catch (error) {
    console.error('[GET /api/plans/[planId]/benefits]', error);

    return NextResponse.json(
      { error: 'Erro ao buscar benefícios do plano' },
      { status: 500 }
    );
  }
}
