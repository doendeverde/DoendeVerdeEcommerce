/**
 * Payment Pending Page
 * 
 * Called by Mercado Pago when payment is pending (e.g., boleto, PIX waiting)
 */

import { Suspense } from "react";
import { Clock, ArrowRight, Copy, CheckCircle } from "lucide-react";
import Link from "next/link";

interface PaymentPendingPageProps {
  searchParams: Promise<{
    collection_id?: string;
    collection_status?: string;
    payment_id?: string;
    status?: string;
    external_reference?: string;
    payment_type?: string;
  }>;
}

async function PaymentPendingContent({ searchParams }: PaymentPendingPageProps) {
  const params = await searchParams;

  const {
    payment_id,
    payment_type,
    external_reference,
  } = params;

  const isPix = payment_type === "pix" || payment_type === "bank_transfer";

  return (
    <main className="bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          {/* Pending Icon */}
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Aguardando pagamento
          </h1>
          <p className="text-gray-600 mb-6">
            {isPix
              ? "Seu pagamento PIX está aguardando confirmação. Assim que identificarmos, sua assinatura será ativada."
              : "Seu pagamento está sendo processado. Você receberá uma confirmação por e-mail."
            }
          </p>

          {/* Payment Details */}
          {payment_id && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Detalhes do pagamento</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">ID do pagamento:</dt>
                  <dd className="text-gray-900 font-mono">{payment_id}</dd>
                </div>
                {payment_type && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Método:</dt>
                    <dd className="text-gray-900 capitalize">{payment_type}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status:</dt>
                  <dd className="text-yellow-600 font-medium">Pendente</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>O que acontece agora?</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Você receberá um e-mail de confirmação</li>
                  <li>• Sua assinatura será ativada automaticamente</li>
                  <li>• Acompanhe o status na sua conta</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/orders"
              className="w-full py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              Acompanhar pedido
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors block"
            >
              Continuar comprando
            </Link>
          </div>
        </div>

        {/* Support */}
        <p className="text-center text-sm text-gray-500 mt-6">
          O pagamento pode levar alguns minutos para ser confirmado.{" "}
          <a href="mailto:contato@doendeverde.com.br" className="text-primary-green hover:underline">
            Precisa de ajuda?
          </a>
        </p>
      </div>
    </main>
  );
}

export default function PaymentPendingPage(props: PaymentPendingPageProps) {
  return (
    <Suspense fallback={
      <main className="bg-gray-50 flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </main>
    }>
      <PaymentPendingContent {...props} />
    </Suspense>
  );
}
