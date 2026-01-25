/**
 * SubscriptionFAQ Component
 *
 * FAQ accordion com perguntas frequentes sobre assinaturas.
 * Client Component para interatividade de abrir/fechar.
 * Otimizado: mínimo JS, estrutura semântica para SEO.
 */

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer:
      "Sim! Você pode cancelar sua assinatura a qualquer momento pelo painel da sua conta. O cancelamento será efetivado ao final do período já pago, e você continuará tendo acesso aos benefícios até lá.",
  },
  {
    question: "Como funcionam os pontos mensais?",
    answer:
      "Assinantes recebem pontos automaticamente todo mês, creditados no dia do vencimento da assinatura. Os pontos podem ser trocados por cupons de desconto ou produtos exclusivos.",
  },
  {
    question: "O desconto é aplicado automaticamente?",
    answer:
      "Sim! O desconto do seu plano é aplicado automaticamente em todas as suas compras. Você verá o valor com desconto já no carrinho e no checkout.",
  },
  {
    question: "Posso mudar de plano depois de assinar?",
    answer:
      "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Em caso de upgrade, a diferença será cobrada proporcionalmente. Em caso de downgrade, a mudança será efetivada no próximo ciclo.",
  },
  {
    question: "Quais são as formas de pagamento?",
    answer:
      "Aceitamos cartão de crédito (Visa, Mastercard, Elo, American Express), cartão de débito e PIX. Para assinaturas, recomendamos cartão de crédito para renovação automática.",
  },
  {
    question: "Os brindes mensais são enviados junto com pedidos?",
    answer:
      "Os brindes dos planos Bronze e Prata são enviados automaticamente todo mês. Se você fizer um pedido no mês, o brinde vai junto. Caso contrário, enviamos separadamente sem custo de frete.",
  },
];

export function SubscriptionFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div>
      <h2
        id="faq-heading"
        className="text-center text-2xl font-bold text-default"
      >
        Perguntas Frequentes
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-muted">
        Tire suas dúvidas sobre nossos planos de assinatura
      </p>

      {/* FAQ List - Semantic structure for SEO */}
      <dl className="mx-auto mt-10 max-w-3xl divide-y divide-gray-border rounded-2xl border border-gray-border bg-card-bg">
        {faqs.map((faq, index) => (
          <div key={index} className="group">
            <dt>
              <button
                onClick={() => toggleFaq(index)}
                className="flex w-full items-center justify-between px-6 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:ring-offset-2"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="text-base font-medium text-default">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 text-muted transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""
                    }`}
                  aria-hidden="true"
                />
              </button>
            </dt>
            <dd
              id={`faq-answer-${index}`}
              className={`overflow-hidden transition-all duration-200 ${openIndex === index ? "max-h-96" : "max-h-0"
                }`}
            >
              <p className="px-6 pb-4 text-sm text-muted">{faq.answer}</p>
            </dd>
          </div>
        ))}
      </dl>

      {/* Schema.org FAQ structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
