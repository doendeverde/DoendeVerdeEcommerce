/**
 * Product Detail Page
 *
 * Página completa de um produto individual.
 * 
 * REGRA DE NEGÓCIO:
 * - Exibe preço base do produto
 * - Desconto é da ASSINATURA, não do produto
 * - ProductDetailPrice usa context para mostrar desconto quando usuário tem assinatura
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Shield, Truck } from 'lucide-react';
import { productService } from '@/services';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { ProductGrid } from '@/components/products';
import { ProductDetailPrice } from '@/components/products/ProductPrice';

// ISR: Revalidate product detail every 5 minutes
export const revalidate = 300;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Produto não encontrado | Doende HeadShop',
    };
  }

  return {
    title: `${product.name} | Doende HeadShop`,
    description: product.description?.slice(0, 160),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await productService.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = product.relatedProducts;

  return (
    <div className="page-content">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-muted hover:text-default transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <Link href="/products" className="text-muted hover:text-default transition-colors">
          Produtos
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-muted hover:text-default transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-default font-medium truncate">{product.name}</span>
      </nav>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image Gallery */}
          <ProductImageGallery images={product.images} productName={product.name} />

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Category */}
            {product.category && (
              <div className="mb-3">
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {product.category.name}
                </Link>
              </div>
            )}

            {/* Name */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
              {product.name}
            </h1>

            {/* Price - Uses SubscriptionProvider context for discount */}
            <div className="mt-6">
              <ProductDetailPrice basePrice={product.basePrice} />
            </div>

            {/* FEATURE DISABLED: Points will be implemented in the future */}
            {/* <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-50 border border-purple-100 px-4 py-2 text-primary-purple">
              <Package className="h-5 w-5" />
              <span className="font-medium">
                Ganhe <strong>+{product.loyaltyPoints} pontos</strong> nesta compra
              </span>
            </div> */}

            {/* Stock Status */}
            <div className="mt-4">
              {product.isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                  Produto indisponível
                </span>
              ) : product.isLowStock ? (
                <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Últimas {product.stock} unidades
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Em estoque
                </span>
              )}
            </div>

            {/* Add to Cart */}
            <div className="mt-8">
              <AddToCartButton
                productId={product.id}
                productSlug={product.slug}
                stock={product.stock}
                isOutOfStock={product.isOutOfStock}
              />
            </div>

            {/* Benefits */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <Truck className="h-6 w-6 text-primary-green" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Frete Grátis</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Acima de R$ 150</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <Shield className="h-6 w-6 text-primary-green" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Compra Segura</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Garantia de 7 dias</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Description */}
        {product.description && (
          <section className="section">
            <h2 className="text-xl font-semibold text-default">Descrição</h2>
            <div className="card">
              <div
                className="prose prose-gray dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          </section>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="section">
            <h2 className="text-xl font-semibold text-default">
              Produtos Relacionados
            </h2>
            <ProductGrid products={relatedProducts} />
          </section>
        )}
    </div>
  );
}
