import { auth } from "@/lib/auth";
import { userService } from "@/services";

export const metadata = {
  title: "Dashboard | Headshop",
  description: "Painel do usuário",
};

// Helper to format Decimal as currency
function formatCurrency(value: { toNumber?: () => number } | number): string {
  const num = typeof value === 'number' ? value : value.toNumber?.() ?? 0;
  return num.toFixed(2);
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  // Use service layer instead of direct Prisma calls
  const { user, recentOrders, activeSubscriptions } = await userService.getUserDashboardData(
    session.user.id
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Olá, {user?.fullName || session.user.name}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo ao seu painel de controle
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total de Pedidos</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {user?._count.orders || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Assinaturas Ativas</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {user?._count.subscriptions || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Endereços Salvos</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {user?._count.addresses || 0}
          </p>
        </div>
      </div>

      {/* Assinaturas Ativas */}
      {activeSubscriptions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Minhas Assinaturas
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {activeSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex justify-between items-center p-4 border rounded-md"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {subscription.plan.name}
                    </h3>
                    {subscription.nextBillingAt && (
                      <p className="text-sm text-gray-500">
                        Próxima cobrança:{" "}
                        {new Date(subscription.nextBillingAt).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      R$ {formatCurrency(subscription.plan.price)}
                    </p>
                    <p className="text-sm text-gray-500">
                      /{subscription.plan.billingCycle === "MONTHLY" ? "mês" : "ano"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pedidos Recentes */}
      {recentOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Pedidos Recentes
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex justify-between items-center p-4 border rounded-md"
                >
                  <div>
                    <p className="font-medium text-gray-900">Pedido #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      R$ {formatCurrency(order.totalAmount)}
                    </p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.status === "DELIVERED"
                        ? "bg-green-100 text-green-800"
                        : order.status === "CANCELED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
