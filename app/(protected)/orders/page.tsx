import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Meus Pedidos | Headshop",
  description: "Histórico de pedidos",
};

export default async function OrdersPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
      payment: true,
      shipment: true,
      address: true,
    },
  });

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
                      R$ {order.totalAmount.toFixed(2)}
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        order.status === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : order.status === "CANCELLED"
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
                  {order.orderItems.map((item) => (
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
                          {item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        R$ {item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informações de Pagamento */}
              {order.payment && (
                <div className="px-6 py-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Pagamento</h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        Método: {order.payment.paymentMethod}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status:{" "}
                        <span
                          className={`font-medium ${
                            order.payment.status === "PAID"
                              ? "text-green-600"
                              : order.payment.status === "FAILED"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {order.payment.status}
                        </span>
                      </p>
                    </div>
                    {order.payment.paidAt && (
                      <p className="text-sm text-gray-600">
                        Pago em{" "}
                        {new Date(order.payment.paidAt).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Informações de Entrega */}
              {order.shipment && (
                <div className="px-6 py-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Entrega</h4>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Método: {order.shipment.shippingMethod}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status:{" "}
                      <span
                        className={`font-medium ${
                          order.shipment.status === "DELIVERED"
                            ? "text-green-600"
                            : order.shipment.status === "CANCELLED"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {order.shipment.status}
                      </span>
                    </p>
                    {order.shipment.trackingCode && (
                      <p className="text-sm text-gray-600">
                        Código de Rastreio: {order.shipment.trackingCode}
                      </p>
                    )}
                    {order.shipment.deliveredAt && (
                      <p className="text-sm text-gray-600">
                        Entregue em{" "}
                        {new Date(order.shipment.deliveredAt).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Endereço de Entrega */}
              {order.address && (
                <div className="px-6 py-4 border-t bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Endereço de Entrega
                  </h4>
                  <p className="text-sm text-gray-600">
                    {order.address.street}, {order.address.number}
                    {order.address.complement && ` - ${order.address.complement}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.address.neighborhood} - {order.address.city}/
                    {order.address.state}
                  </p>
                  <p className="text-sm text-gray-600">
                    CEP: {order.address.zipCode}
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
