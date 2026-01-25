/**
 * Admin New Benefit Page
 *
 * Form to create a new subscription benefit.
 */

'use client';

import { useRouter } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { BenefitForm, BenefitFormData } from '@/components/admin/benefits';

export default function NewBenefitPage() {
  const router = useRouter();

  const handleSubmit = async (data: BenefitFormData) => {
    const res = await fetch('/api/admin/benefits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erro ao criar benefício');
    }

    router.push('/admin/benefits');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Novo Benefício"
        description="Crie um novo benefício para os planos de assinatura"
        back={{ href: '/admin/benefits', label: 'Voltar para benefícios' }}
      />

      <BenefitForm onSubmit={handleSubmit} />
    </div>
  );
}
