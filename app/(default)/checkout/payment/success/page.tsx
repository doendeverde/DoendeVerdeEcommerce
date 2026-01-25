/**
 * Payment Success Page
 * 
 * Called by Mercado Pago after successful payment
 * URL: /checkout/payment/success?collection_id=xxx&collection_status=xxx&payment_id=xxx&...
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CheckCircle2, ArrowRight, Package } from "lucide-react";
import Link from "next/link";

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    collection_id?: string;
    collection_status?: string;
    payment_id?: string;
    status?: string;
    external_reference?: string;
    payment_type?: string;
    merchant_order_id?: string;
    preference_id?: string;
    site_id?: string;
    processing_mode?: string;
    merchant_account_id?: string;
  }>;
}

async function PaymentSuccessContent({ searchParams }: PaymentSuccessPageProps) {
  const params = await searchParams;

  const {
    payment_id,
    status,
    collection_status,
    external_reference,
    payment_type,
  } = params;

  const finalStatus = status || collection_status;

  // Se não for aprovado, redirecionar para pending ou failure
  if (finalStatus === "pending") {
    redirect(`/checkout/payment/pending?${new URLSearchParams(params as Record<string, string>).toString()}`);
  }
  if (finalStatus === "rejected" || finalStatus === "cancelled") {
    redirect(`/checkout/payment/failure?${new URLSearchParams(params as Record<string, string>).toString()}`);
  }

  return (
    <main className="bg-page flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-surface rounded-2xl shadow-sm p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-bg rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-text" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-default mb-2">
            Pagamento Confirmado!
          </h1>
          <p className="text-muted mb-6">
            Sua assinatura foi ativada com sucesso. Você receberá um e-mail com todos os detalhes.
          </p>

          {/* Payment Details */}
          {payment_id && (
            <div className="bg-gray-bg rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-muted mb-2">Detalhes do pagamento</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">ID do pagamento:</dt>
                  <dd className="text-default font-mono">{payment_id}</dd>
                </div>
                {payment_type && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Método:</dt>
                    <dd className="text-default capitalize">{payment_type}</dd>
                  </div>
                )}
                {external_reference && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Referência:</dt>
                    <dd className="text-default font-mono text-xs">{external_reference.substring(0, 16)}...</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-primary-green/5 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-left">
              <Package className="w-8 h-8 text-primary-green flex-shrink-0" />
              <div>
                <p className="font-medium text-default">Próximos passos</p>
                <p className="text-sm text-muted">
                  Estamos preparando seu kit personalizado. Você receberá atualizações sobre o envio.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/subscriptions"
              className="w-full py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              Ver minha assinatura
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-default text-default rounded-lg font-medium hover-bg transition-colors block"
            >
              Voltar para a loja
            </Link>
          </div>
        </div>

        {/* Support */}
        <p className="text-center text-sm text-muted mt-6">
          Dúvidas? Entre em contato pelo{" "}
          <a href="mailto:contato@doendeverde.com.br" className="text-primary-green hover:underline">
            contato@doendeverde.com.br
          </a>
        </p>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage(props: PaymentSuccessPageProps) {
  return (
    <Suspense fallback={
      <main className="bg-gray-50 flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-400">Carregando...</div>
      </main>
    }>
      <PaymentSuccessContent {...props} />
    </Suspense>
  );
}
