/**
 * New Shipping Profile Page
 */

import { AdminPageHeader } from "@/components/admin";
import { ShippingProfileForm } from "@/components/admin/shipping/ShippingProfileForm";

export const metadata = {
  title: "Novo Perfil de Frete | Admin",
  description: "Criar novo perfil de frete",
};

export default function NewShippingProfilePage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Novo Perfil de Frete"
        description="Crie um perfil com peso e dimensões para calcular o frete"
        back={{
          href: "/admin/shipping",
          label: "Voltar para Perfis",
        }}
      />

      <div className="max-w-2xl">
        <ShippingProfileForm />
      </div>
    </div>
  );
}
