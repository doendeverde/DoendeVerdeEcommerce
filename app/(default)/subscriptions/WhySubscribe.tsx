/**
 * WhySubscribe Component — Server Component
 *
 * Seção explicativa com benefícios de assinar.
 * 100% Server Component - sem JS no cliente.
 */

import { Gift, Percent, Truck, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: Percent,
    title: "Descontos Permanentes",
    description:
      "Ganhe até 20% de desconto em todas as suas compras, todos os dias.",
  },
  // {
  //   icon: Gift,
  //   title: "Pontos Automáticos",
  //   description:
  //     "Receba pontos todo mês automaticamente para trocar por produtos.",
  // },
  {
    icon: Truck,
    title: "Frete Grátis",
    description:
      "Assinantes têm frete grátis em compras acima de R$ 100 ou em todas.",
  },
  {
    icon: Sparkles,
    title: "Acesso Exclusivo",
    description:
      "Produtos e lançamentos exclusivos apenas para membros da comunidade.",
  },
];

export function WhySubscribe() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-6 py-12 sm:px-12">
      <h2
        id="benefits-heading"
        className="text-center text-2xl font-bold text-default"
      >
        Por que assinar?
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-muted">
        Vantagens exclusivas para membros da comunidade Doende Verde
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div
              key={index}
              className="flex flex-col items-center rounded-xl bg-card-bg p-6 text-center shadow-sm"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full bg-green-bg text-green-text"
                aria-hidden="true"
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-default">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{benefit.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
