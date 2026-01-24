/**
 * Home Page — Product Catalog
 *
 * Features:
 * - Hero section with value proposition
 * - Featured products from database
 * - Category quick links
 * - Search CTA
 */

import Link from 'next/link';
import { ArrowRight, Truck, Shield, Gift, Crown } from 'lucide-react';
import { productService } from '@/services';
import { ProductGrid, CategoryGrid, SearchBar, CategoryChips } from '@/components/products';
import { GuestCTASection } from '@/components/layout/GuestCTASection';
import type { CategoryItem, ProductFilters } from '@/types/product';

export default async function HomePage() {
  // Toggle hero section visibility
  const showHero = false;

  // Toggle benefits bar visibility
  const showBenefits = false;

  // Fetch products and categories using same service as products page
  const filters: ProductFilters = {
    sortBy: 'newest',
    limit: 12,
    page: 1,
  };

  const result = await productService.getProductsWithCategories(filters);
  const { products, categories } = result;

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      {showHero && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-purple to-purple-600 px-6 py-12 text-white sm:px-12 sm:py-16">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Crown className="h-4 w-4" />
              Assinaturas VIP Disponíveis
            </span>
            <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Sua experiência premium começa aqui
            </h1>
            <p className="mt-4 text-lg text-white/80">
              Os melhores acessórios, piteiras, bongs e muito mais. Assine e tenha descontos exclusivos em todas as suas compras.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-primary-purple transition-all hover:bg-gray-100"
              >
                Ver Produtos
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/subscriptions"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                Conhecer Planos
              </Link>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5" />
        </section>
      )}

      {/* Benefits Bar */}
      {showBenefits && (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Truck className="h-5 w-5 text-primary-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Frete Grátis</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Acima de R$ 150</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Shield className="h-5 w-5 text-primary-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Compra Segura</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Garantia de 7 dias</p>
            </div>
          </div>
          {/* FEATURE DISABLED: Points card will be implemented in the future */}
          {/* <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <Gift className="h-5 w-5 text-primary-purple" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ganhe Pontos</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">A cada compra</p>
          </div>
        </div> */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Crown className="h-5 w-5 text-primary-purple" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Planos VIP</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Descontos exclusivos</p>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {/* {categories.length > 0 && ( */}
      {false && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Categorias</h2>
            <Link
              href="/products"
              className="text-sm font-medium text-primary-green hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <CategoryGrid categories={categories} maxDisplay={6} />
        </section>
      )}

      {/* Featured Products */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Produtos em Destaque</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Os mais pedidos pelos nossos clientes
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-green hover:underline"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
              Nenhum produto cadastrado ainda
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Os produtos aparecerão aqui assim que forem adicionados.
            </p>
          </div>
        )}
      </section>

      {/* CTA Section - Only for non-authenticated users */}
      <GuestCTASection />
    </div >
  );
}
