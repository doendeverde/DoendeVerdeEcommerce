import { auth } from "@/lib/auth";
import { userService } from "@/services";

export const metadata = {
  title: "Meus Pedidos | Headshop",
  description: "Histórico de pedidos",
};

// Helper to format Decimal as currency
function formatCurrency(value: { toNumber?: () => number } | number): string {
  const num = typeof value === 'number' ? value : value.toNumber?.() ?? 0;
  return num.toFixed(2);
}

export default async function OrdersPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  // Use service layer instead of direct Prisma calls
  const orders = await userService.getUserOrders(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meus Pedidos</h1>
        <p className="text-gray-600 mt-1">
          Acompanhe todos os seus pedidos e entregas
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">Você ainda não fez nenhum pedido</p>
          <a
            href="/"
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Começar a Comprar
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow">
              {/* Header do Pedido */}
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Pedido #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Realizado em{" "}
                      {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      R$ {formatCurrency(order.totalAmount)}
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${order.status === "DELIVERED"
                        ? "bg-green-100 text-green-800"
                        : order.status === "CANCELED"
                          ? "bg-red-100 text-red-800"
                          : order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items do Pedido */}
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">Itens do Pedido</h4>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantidade: {item.quantity} x R${" "}
                          {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        R$ {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informações de Pagamento */}
              {order.payments && order.payments.length > 0 && (
                <div className="px-6 py-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Pagamento</h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        Provedor: {order.payments[0].provider}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status:{" "}
                        <span
                          className={`font-medium ${order.payments[0].status === "PAID"
                            ? "text-green-600"
                            : order.payments[0].status === "FAILED"
                              ? "text-red-600"
                              : "text-yellow-600"
                            }`}
                        >
                          {order.payments[0].status}
                        </span>
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      R$ {formatCurrency(order.payments[0].amount)}
                    </p>
                  </div>
                </div>
              )}

              {/* Informações de Entrega */}
              {order.shipments && order.shipments.length > 0 && (
                <div className="px-6 py-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Entrega</h4>
                  <div className="space-y-1">
                    {order.shipments[0].carrier && (
                      <p className="text-sm text-gray-600">
                        Transportadora: {order.shipments[0].carrier}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Status:{" "}
                      <span
                        className={`font-medium ${order.shipments[0].status === "DELIVERED"
                          ? "text-green-600"
                          : order.shipments[0].status === "LOST" || order.shipments[0].status === "RETURNED"
                            ? "text-red-600"
                            : "text-blue-600"
                          }`}
                      >
                        {order.shipments[0].status}
                      </span>
                    </p>
                    {order.shipments[0].trackingCode && (
                      <p className="text-sm text-gray-600">
                        Código de Rastreio: {order.shipments[0].trackingCode}
                      </p>
                    )}
                    {order.shipments[0].deliveredAt && (
                      <p className="text-sm text-gray-600">
                        Entregue em{" "}
                        {new Date(order.shipments[0].deliveredAt).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Endereço de Entrega */}
              {order.addressSnapshot && (
                <div className="px-6 py-4 border-t bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Endereço de Entrega
                  </h4>
                  <p className="text-sm text-gray-600">
                    {order.addressSnapshot.street}, {order.addressSnapshot.number}
                    {order.addressSnapshot.complement && ` - ${order.addressSnapshot.complement}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.addressSnapshot.neighborhood} - {order.addressSnapshot.city}/
                    {order.addressSnapshot.state}
                  </p>
                  <p className="text-sm text-gray-600">
                    CEP: {order.addressSnapshot.zipCode}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
