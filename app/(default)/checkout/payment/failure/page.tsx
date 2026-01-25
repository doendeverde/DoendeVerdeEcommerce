/**
 * Payment Failure Page
 * 
 * Called by Mercado Pago after failed/rejected payment
 */

import { Suspense } from "react";
import { XCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

interface PaymentFailurePageProps {
  searchParams: Promise<{
    collection_id?: string;
    collection_status?: string;
    payment_id?: string;
    status?: string;
    external_reference?: string;
    payment_type?: string;
  }>;
}

const errorMessages: Record<string, string> = {
  cc_rejected_bad_filled_card_number: "Número do cartão incorreto",
  cc_rejected_bad_filled_date: "Data de validade incorreta",
  cc_rejected_bad_filled_other: "Algum dado do cartão está incorreto",
  cc_rejected_bad_filled_security_code: "CVV incorreto",
  cc_rejected_blacklist: "Não foi possível processar o pagamento",
  cc_rejected_call_for_authorize: "Você deve autorizar o pagamento com a operadora",
  cc_rejected_card_disabled: "Cartão inativo. Ative-o ou use outro cartão",
  cc_rejected_duplicated_payment: "Pagamento duplicado. Já existe um pagamento recente",
  cc_rejected_high_risk: "Pagamento recusado por segurança",
  cc_rejected_insufficient_amount: "Saldo insuficiente",
  cc_rejected_invalid_installments: "Parcelas não disponíveis",
  cc_rejected_max_attempts: "Limite de tentativas atingido",
  rejected: "Pagamento recusado",
  cancelled: "Pagamento cancelado",
};

async function PaymentFailureContent({ searchParams }: PaymentFailurePageProps) {
  const params = await searchParams;

  const {
    payment_id,
    status,
    collection_status,
    external_reference,
  } = params;

  const finalStatus = status || collection_status || "rejected";
  const errorMessage = errorMessages[finalStatus] || "Pagamento não foi aprovado";

  return (
    <main className="bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento não aprovado
          </h1>
          <p className="text-gray-600 mb-6">
            {errorMessage}. Não se preocupe, você pode tentar novamente.
          </p>

          {/* Payment Details */}
          {payment_id && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Detalhes</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">ID do pagamento:</dt>
                  <dd className="text-gray-900 font-mono">{payment_id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status:</dt>
                  <dd className="text-red-600 font-medium capitalize">{finalStatus}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Tips */}
          <div className="bg-yellow-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-yellow-800 mb-2">Dicas:</h3>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Verifique os dados do cartão</li>
              <li>Tente outro método de pagamento</li>
              <li>Entre em contato com seu banco</li>
              <li>Use PIX para pagamento instantâneo</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={external_reference ? `/checkout/subscription/${external_reference.split("_")[0]}` : "/subscriptions"}
              className="w-full py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-gray-border text-text-secondary rounded-lg font-medium hover:bg-hover-bg transition-colors block text-center"
            >
              Voltar para a loja
            </Link>
          </div>
        </div>

        {/* Support */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Precisa de ajuda?{" "}
          <a href="mailto:contato@doendeverde.com.br" className="text-primary-green hover:underline">
            Fale conosco
          </a>
        </p>
      </div>
    </main>
  );
}

export default function PaymentFailurePage(props: PaymentFailurePageProps) {
  return (
    <Suspense fallback={
      <main className="bg-gray-50 flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </main>
    }>
      <PaymentFailureContent {...props} />
    </Suspense>
  );
}
