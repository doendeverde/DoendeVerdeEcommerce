/**
 * Admin Shipping Profiles Page
 *
 * List and manage shipping profiles for products and subscription plans.
 */

import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin";
import { ShippingProfilesList } from "@/components/admin/shipping/ShippingProfilesList";

export const metadata = {
  title: "Perfis de Frete | Admin",
  description: "Gerenciar perfis de frete para produtos e planos",
};

export default function ShippingProfilesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Perfis de Frete"
        description="Gerencie os perfis de frete usados para calcular o valor do envio"
        action={{
          label: "Novo Perfil",
          href: "/admin/shipping/new",
        }}
      />

      <Suspense
        fallback={
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          </div>
        }
      >
        <ShippingProfilesList />
      </Suspense>
    </div>
  );
}
