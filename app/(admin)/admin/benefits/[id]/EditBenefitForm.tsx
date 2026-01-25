/**
 * Edit Benefit Form (Client Component)
 */

'use client';

import { useRouter } from 'next/navigation';
import { BenefitForm, BenefitFormData } from '@/components/admin/benefits';
import type { Benefit } from '@prisma/client';

interface EditBenefitFormProps {
  benefit: Benefit;
}

export function EditBenefitForm({ benefit }: EditBenefitFormProps) {
  const router = useRouter();

  const handleSubmit = async (data: BenefitFormData) => {
    const res = await fetch(`/api/admin/benefits/${benefit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erro ao atualizar benefício');
    }

    router.push('/admin/benefits');
    router.refresh();
  };

  return <BenefitForm benefit={benefit} onSubmit={handleSubmit} />;
}
