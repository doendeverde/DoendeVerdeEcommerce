/**
 * Admin Edit Benefit Page
 *
 * Form to edit an existing subscription benefit.
 */

import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import * as benefitService from '@/services/benefit.service';
import { EditBenefitForm } from './EditBenefitForm';

export const metadata: Metadata = {
  title: 'Editar Benefício | Admin - Doende Verde',
  description: 'Editar benefício de assinatura',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBenefitPage({ params }: PageProps) {
  const { id } = await params;

  // Auth check
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Load benefit
  const benefit = await benefitService.getBenefitById(id);

  if (!benefit) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Editar: ${benefit.name}`}
        description="Edite as informações do benefício"
        back={{ href: '/admin/benefits', label: 'Voltar para benefícios' }}
      />

      <EditBenefitForm benefit={benefit} />
    </div>
  );
}
