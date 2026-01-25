/**
 * Admin Benefits List Page
 *
 * Displays all subscription benefits with CRUD actions.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { BenefitsList } from '@/components/admin/benefits';
import * as benefitService from '@/services/benefit.service';

export const metadata: Metadata = {
  title: 'Benefícios | Admin - Doende Verde',
  description: 'Gerenciar benefícios de assinatura',
};

export default async function AdminBenefitsPage() {
  // Auth check
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Load benefits
  const { benefits } = await benefitService.listBenefits({
    orderBy: 'displayOrder',
    orderDir: 'asc',
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Benefícios de Assinatura"
        description="Gerencie os benefícios disponíveis nos planos de assinatura"
      />

      <BenefitsList benefits={benefits} />
    </div>
  );
}
