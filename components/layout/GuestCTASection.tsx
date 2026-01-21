/**
 * GuestCTASection Component
 *
 * CTA section that only appears for non-authenticated users.
 * Encourages visitors to create an account.
 */

'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function GuestCTASection() {
  const { data: session, status } = useSession();

  // Don't show if loading or if user is authenticated
  if (status === 'loading' || session) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-gradient-to-r from-primary-green to-green-600 px-6 py-12 text-center text-white sm:px-12">
      <h2 className="text-2xl font-bold sm:text-3xl">
        Pronto para começar?
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
        Crie sua conta grátis e aproveite nossas assinaturas VIP com descontos exclusivos. Quanto mais você compra, mais você economiza!
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-primary-green transition-all hover:bg-gray-100"
        >
          Criar Conta Grátis
        </Link>
        <Link
          href="/subscriptions"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
        >
          Ver Planos de Assinatura
        </Link>
      </div>
    </section>
  );
}
