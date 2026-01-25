import { adminService } from "@/services/admin.service";
import { CreditCard, Plus, Pencil, Star, Users } from "lucide-react";
import Link from "next/link";
import { PlanDeleteButton } from "@/components/admin/subscriptions";

export const dynamic = "force-dynamic";

/**
 * Formata valor para exibição
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Retorna texto do ciclo de cobrança
 */
function getCycleText(cycle: string): string {
  switch (cycle) {
    case "MONTHLY":
      return "Mensal";
    case "QUARTERLY":
      return "Trimestral";
    case "SEMIANNUAL":
      return "Semestral";
    case "ANNUAL":
      return "Anual";
    default:
      return cycle;
  }
}

/**
 * Página de Planos de Assinatura (Admin)
 * Listagem com CRUD completo
 */
export default async function AdminSubscriptionPlansPage() {
  const plans = await adminService.getSubscriptionPlans();

  return (
    <div className="page-content">
      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default">Planos de Assinatura</h1>
          <p className="text-muted text-sm">
            {plans.length} plano(s) cadastrado(s)
          </p>
        </div>
        <Link
          href="/admin/subscriptions/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Plano
        </Link>
      </div>

      {/* Grid de Planos */}
      {plans.length === 0 ? (
        <div className="bg-surface rounded-xl border border-default p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhum plano de assinatura cadastrado</p>
          <Link
            href="/admin/subscriptions/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro plano
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-surface rounded-xl border overflow-hidden transition-all ${plan.isFeatured
                ? "border-purple-500/50 ring-1 ring-purple-500/20"
                : "border-default"
                }`}
            >
              {/* Imagem ou Placeholder */}
              <div className="relative h-32 bg-gradient-to-br from-purple-600/20 to-green-600/20">
                {plan.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={plan.imageUrl}
                    alt={plan.name}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {plan.isFeatured && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/90 text-white text-xs font-medium rounded-full">
                      <Star className="w-3 h-3" />
                      Destaque
                    </span>
                  )}
                  {!plan.isActive && (
                    <span className="px-2 py-1 bg-gray-200/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                      Inativo
                    </span>
                  )}
                </div>

                {/* Ações */}
                <div className="absolute top-3 right-3 flex gap-1">
                  <Link
                    href={`/admin/subscriptions/${plan.id}`}
                    className="p-2 bg-card-bg/80 hover:bg-hover-bg text-text-primary rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <PlanDeleteButton
                    planId={plan.id}
                    planName={plan.name}
                    subscriptionsCount={plan.subscribersCount}
                  />
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-4 space-y-4">
                {/* Nome e Preço */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                  {plan.shortDescription && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {plan.shortDescription}
                    </p>
                  )}
                </div>

                {/* Preço */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    / {getCycleText(plan.billingCycle).toLowerCase()}
                  </span>
                </div>

                {/* Features */}
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-1">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-xs text-gray-500 dark:text-gray-500">
                        +{plan.features.length - 3} mais benefícios
                      </li>
                    )}
                  </ul>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-border">
                  <Link
                    href={`/admin/user-subscriptions?plan=${plan.id}`}
                    className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    {plan.subscribersCount} assinante(s)
                  </Link>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${plan.isActive
                      ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                  >
                    {plan.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
