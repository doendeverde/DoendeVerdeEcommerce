import { adminService } from "@/services/admin.service";
import { Users, CreditCard, Calendar, Search } from "lucide-react";
import Link from "next/link";
import { SubscriptionStatusBadge, SubscriptionStatusButton } from "@/components/admin/user-subscriptions";
import { FormattedDate } from "@/components/ui/FormattedDate";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    planId?: string;
    search?: string;
    page?: string;
  }>;
}

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
 * Página de Gestão de Assinaturas de Usuários (Admin)
 */
export default async function AdminUserSubscriptionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const result = await adminService.getUserSubscriptions({
    status: params.status,
    planId: params.planId,
    search: params.search,
    page: parseInt(params.page || "1"),
    pageSize: 20,
  });

  const plans = await adminService.getSubscriptionPlans();

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default">Assinaturas de Usuários</h1>
          <p className="text-muted text-sm">
            {result.total} assinatura(s) encontrada(s)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface rounded-xl border border-default p-4">
        <form className="flex flex-wrap gap-4">
          {/* Busca */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                name="search"
                defaultValue={params.search}
                placeholder="Buscar por nome ou email..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-bg border border-gray-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Status */}
          <select
            name="status"
            defaultValue={params.status}
            className="px-4 py-2.5 bg-gray-bg border border-gray-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all"
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativas</option>
            <option value="PAUSED">Pausadas</option>
            <option value="PENDING_CANCELLATION">Cancelamento Pendente</option>
            <option value="CANCELED">Canceladas</option>
            <option value="EXPIRED">Expiradas</option>
          </select>

          {/* Plano */}
          <select
            name="planId"
            defaultValue={params.planId}
            className="px-4 py-2.5 bg-gray-bg border border-gray-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all"
          >
            <option value="">Todos os planos</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2.5 bg-primary-green hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabela de Assinaturas */}
      <div className="bg-surface rounded-xl border border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-bg">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Início
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Próx. Cobrança
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {result.subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-border mx-auto mb-3" />
                    <p className="text-text-secondary">
                      Nenhuma assinatura encontrada
                    </p>
                  </td>
                </tr>
              ) : (
                result.subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-gray-bg transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-purple/10 rounded-full flex items-center justify-center">
                          <span className="text-primary-purple font-medium">
                            {sub.user.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <Link
                            href={`/admin/users/${sub.user.id}`}
                            className="text-sm font-medium text-text-primary hover:text-primary-green transition-colors"
                          >
                            {sub.user.fullName}
                          </Link>
                          <p className="text-xs text-text-secondary">{sub.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-primary-purple" />
                          <span className="text-sm text-text-primary">{sub.plan.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-secondary">
                            {formatCurrency(Number(sub.plan.price))}
                          </span>
                          {sub.plan.discountPercent > 0 && (
                            <span className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">
                              {sub.plan.discountPercent}% off
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <SubscriptionStatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Calendar className="w-4 h-4" />
                        <FormattedDate date={sub.startedAt} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {sub.nextBillingAt ? (
                        <FormattedDate date={sub.nextBillingAt} className="text-sm text-text-primary" />
                      ) : (
                        <span className="text-sm text-text-secondary">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <SubscriptionStatusButton
                          subscriptionId={sub.id}
                          currentStatus={sub.status}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {result.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-default flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Página {result.page} de {result.totalPages}
            </p>
            <div className="flex gap-2">
              {result.page > 1 && (
                <Link
                  href={`/admin/user-subscriptions?page=${result.page - 1}${params.status ? `&status=${params.status}` : ""
                    }${params.planId ? `&planId=${params.planId}` : ""}${params.search ? `&search=${params.search}` : ""
                    }`}
                  className="px-3 py-1.5 bg-gray-bg hover:bg-gray-border text-text-primary text-sm rounded-lg transition-colors"
                >
                  Anterior
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link
                  href={`/admin/user-subscriptions?page=${result.page + 1}${params.status ? `&status=${params.status}` : ""
                    }${params.planId ? `&planId=${params.planId}` : ""}${params.search ? `&search=${params.search}` : ""
                    }`}
                  className="px-3 py-1.5 bg-gray-bg hover:bg-gray-border text-text-primary text-sm rounded-lg transition-colors"
                >
                  Próxima
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
