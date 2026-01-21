/**
 * Edit Shipping Profile Page
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { ShippingProfileForm } from "@/components/admin/shipping";
import { shippingRepository } from "@/repositories/shipping.repository";

export const metadata = {
  title: "Editar Perfil de Frete | Admin",
  description: "Editar perfil de frete existente",
};

interface EditShippingProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditShippingProfilePage({
  params,
}: EditShippingProfilePageProps) {
  const { id } = await params;
  const profile = await shippingRepository.getWithRelations(id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/shipping"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <AdminPageHeader
          title="Editar Perfil de Frete"
          description={`Editando: ${profile.name}`}
        />
      </div>

      <div className="max-w-2xl">
        <ShippingProfileForm profile={profile} />
      </div>

      {/* Show linked items */}
      {(profile._count?.products ?? 0) > 0 ||
        (profile._count?.subscriptionPlans ?? 0) > 0 ? (
        <div className="max-w-2xl bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-medium text-text-primary mb-4">
            Itens Vinculados
          </h3>

          <div className="space-y-3 text-sm">
            {(profile._count?.products ?? 0) > 0 && (
              <p className="text-text-secondary">
                <span className="font-medium text-text-primary">
                  {profile._count?.products}
                </span>{" "}
                produto(s) usando este perfil
              </p>
            )}

            {(profile._count?.subscriptionPlans ?? 0) > 0 && (
              <p className="text-text-secondary">
                <span className="font-medium text-text-primary">
                  {profile._count?.subscriptionPlans}
                </span>{" "}
                plano(s) de assinatura usando este perfil
              </p>
            )}
          </div>

          {/* Sample linked items */}
          {profile.products && profile.products.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-border">
              <p className="text-xs text-text-muted mb-2">
                Produtos (primeiros 10):
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.products.map((p) => (
                  <span
                    key={p.id}
                    className="px-2 py-1 bg-gray-100 rounded text-xs text-text-secondary"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.subscriptionPlans && profile.subscriptionPlans.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-border">
              <p className="text-xs text-text-muted mb-2">
                Planos (primeiros 10):
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.subscriptionPlans.map((p) => (
                  <span
                    key={p.id}
                    className="px-2 py-1 bg-primary-green/10 rounded text-xs text-primary-green"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
