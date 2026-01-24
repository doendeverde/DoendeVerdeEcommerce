import { notFound } from "next/navigation";
import { adminService } from "@/services/admin.service";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShoppingCart,
  CreditCard,
  Shield,
  AlertCircle,
} from "lucide-react";
import { UserRoleButton } from "@/components/admin/users/UserRoleButton";
import { UserStatusButton } from "@/components/admin/users/UserStatusButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
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
 * Formata data
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Badge de status
 */
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Ativo", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    BLOCKED: { label: "Bloqueado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    PENDING: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    PAID: { label: "Pago", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    SHIPPED: { label: "Enviado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    DELIVERED: { label: "Entregue", className: "bg-primary-purple/10 text-primary-purple" },
    CANCELED: { label: "Cancelado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    PAUSED: { label: "Pausado", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  };

  const config = configs[status] || { label: status, className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

/**
 * Página de Detalhes do Usuário (Admin)
 */
export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await adminService.getUserFullDetails(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="p-2 hover:bg-gray-bg rounded-lg text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">{user.fullName}</h1>
          <p className="text-text-secondary text-sm">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <UserStatusButton userId={user.id} currentStatus={user.status} />
          <UserRoleButton userId={user.id} currentRole={user.role} />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-default p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-green/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-primary-green" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{user.totals.ordersCount}</p>
              <p className="text-sm text-text-secondary">Pedidos</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-default p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-purple/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-primary-purple" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {formatCurrency(user.totals.totalSpent)}
              </p>
              <p className="text-sm text-text-secondary">Total Gasto</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-default p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{user.totals.subscriptionsCount}</p>
              <p className="text-sm text-text-secondary">Assinaturas</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-default p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{user.addresses.length}</p>
              <p className="text-sm text-text-secondary">Endereços</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Informações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Pessoais */}
        <div className="bg-surface rounded-xl border border-default p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-purple" />
            Informações Pessoais
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-default">
              <span className="text-text-secondary">Status</span>
              <StatusBadge status={user.status} />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-default">
              <span className="text-text-secondary">Role</span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${user.role === "ADMIN"
                ? "bg-primary-purple/10 text-primary-purple"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}>
                {user.role === "ADMIN" ? "Administrador" : "Cliente"}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-default">
              <span className="text-text-secondary flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </span>
              <span className="text-text-primary">{user.email}</span>
            </div>

            {user.whatsapp && (
              <div className="flex items-center justify-between py-2 border-b border-default">
                <span className="text-text-secondary flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </span>
                <span className="text-text-primary">{user.whatsapp}</span>
              </div>
            )}

            {user.birthDate && (
              <div className="flex items-center justify-between py-2 border-b border-default">
                <span className="text-text-secondary flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data de Nascimento
                </span>
                <span className="text-text-primary">{formatDate(user.birthDate)}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <span className="text-text-secondary">Cadastrado em</span>
              <span className="text-text-primary">{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Endereços */}
        <div className="bg-surface rounded-xl border border-default p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Endereços
          </h2>

          {user.addresses.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-muted mx-auto mb-2" />
              <p className="text-text-secondary text-sm">Nenhum endereço cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {user.addresses.map((address) => (
                <div
                  key={address.id}
                  className="p-3 bg-gray-bg rounded-lg border border-default"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {address.label && (
                      <span className="text-sm font-medium text-text-primary">{address.label}</span>
                    )}
                    {address.isDefault && (
                      <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-primary">
                    {address.street}, {address.number}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {address.neighborhood} - {address.city}/{address.state}
                  </p>
                  <p className="text-xs text-text-secondary">CEP: {address.zipCode}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Pedidos */}
      <div className="bg-surface rounded-xl border border-default p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary-green" />
          Últimos Pedidos
        </h2>

        {user.orders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-10 h-10 text-muted mx-auto mb-2" />
            <p className="text-text-secondary text-sm">Nenhum pedido realizado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-text-secondary uppercase">
                  <th className="pb-3">Pedido</th>
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Itens</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border">
                {user.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-bg">
                    <td className="py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-medium text-text-primary hover:text-primary-green"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="py-3 text-sm text-text-secondary">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 text-sm text-text-secondary">
                      {order.itemsCount} item(s)
                    </td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-sm text-text-primary text-right">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assinaturas */}
      <div className="bg-surface rounded-xl border border-default p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary-purple" />
          Assinaturas
        </h2>

        {user.subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-10 h-10 text-muted mx-auto mb-2" />
            <p className="text-text-secondary text-sm">Nenhuma assinatura</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-text-secondary uppercase">
                  <th className="pb-3">Plano</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Início</th>
                  <th className="pb-3">Próx. Cobrança</th>
                  <th className="pb-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-border">
                {user.subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-bg">
                    <td className="py-3">
                      <Link
                        href={`/admin/subscriptions/${sub.plan.id}`}
                        className="text-sm font-medium text-text-primary hover:text-primary-purple"
                      >
                        {sub.plan.name}
                      </Link>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-3 text-sm text-text-secondary">
                      {formatDate(sub.startedAt)}
                    </td>
                    <td className="py-3 text-sm text-text-secondary">
                      {sub.nextBillingAt ? formatDate(sub.nextBillingAt) : "-"}
                    </td>
                    <td className="py-3 text-sm text-text-primary text-right">
                      {formatCurrency(sub.plan.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
