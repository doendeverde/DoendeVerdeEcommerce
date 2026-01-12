import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Minhas Assinaturas | Headshop",
  description: "Gerencie suas assinaturas",
};

export default async function SubscriptionsPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const subscriptions = await prisma.userSubscription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      subscriptionPlan: {
        include: {
          subscriptionPlanItems: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE");
  const inactiveSubscriptions = subscriptions.filter((s) => s.status !== "ACTIVE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Minhas Assinaturas</h1>
        <p className="text-gray-600 mt-1">
          Gerencie suas assinaturas e planos recorrentes
        </p>
      </div>

      {/* Assinaturas Ativas */}
      {activeSubscriptions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Assinaturas Ativas ({activeSubscriptions.length})
          </h2>
          <div className="space-y-4">
            {activeSubscriptions.map((subscription) => (
              <div key={subscription.id} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {subscription.subscriptionPlan.name}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {subscription.subscriptionPlan.description}
                      </p>
                    </div>
                    <span className="inline-flex px-3 py-1 text-sm font-semibold bg-green-100 text-green-800 rounded-full">
                      ATIVA
                    </span>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações da Assinatura */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Informações da Assinatura
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-semibold text-gray-900">
                          R$ {subscription.subscriptionPlan.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ciclo:</span>
                        <span className="text-gray-900">
                          {subscription.subscriptionPlan.billingCycle === "MONTHLY"
                            ? "Mensal"
                            : "Anual"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Início:</span>
                        <span className="text-gray-900">
                          {new Date(subscription.startDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Próxima cobrança:</span>
                        <span className="font-medium text-blue-600">
                          {new Date(subscription.nextBillingDate).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Produtos Inclusos */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Produtos Inclusos
                    </h4>
                    <div className="space-y-2">
                      {subscription.subscriptionPlan.subscriptionPlanItems.map(
                        (item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                          >
                            <span className="text-gray-700">
                              {item.product.name}
                            </span>
                            <span className="text-gray-600">
                              {item.quantity}x
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="px-6 py-4 border-t bg-gray-50">
                  <div className="flex gap-3">
                    <button className="px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">
                      Pausar Assinatura
                    </button>
                    <button className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assinaturas Inativas */}
      {inactiveSubscriptions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Histórico ({inactiveSubscriptions.length})
          </h2>
          <div className="space-y-4">
            {inactiveSubscriptions.map((subscription) => (
              <div key={subscription.id} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {subscription.subscriptionPlan.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(subscription.startDate).toLocaleDateString("pt-BR")}{" "}
                        - {subscription.endDate
                          ? new Date(subscription.endDate).toLocaleDateString("pt-BR")
                          : "Ativa"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        subscription.status === "PAUSED"
                          ? "bg-yellow-100 text-yellow-800"
                          : subscription.status === "CANCELED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {subscription.status}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-600">
                    R$ {subscription.subscriptionPlan.price.toFixed(2)} /{" "}
                    {subscription.subscriptionPlan.billingCycle === "MONTHLY"
                      ? "mês"
                      : "ano"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sem Assinaturas */}
      {subscriptions.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">
            Você ainda não tem nenhuma assinatura
          </p>
          <a
            href="/"
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Explorar Planos
          </a>
        </div>
      )}
    </div>
  );
}
