/**
 * Product Detail Page
 *
 * Página completa de um produto individual.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Package, Shield, Truck } from 'lucide-react';
import { productService } from '@/services';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { ProductGrid } from '@/components/products';

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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm">
          <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Link href="/products" className="text-gray-500 hover:text-gray-700 transition-colors">
            Produtos
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
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
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  {product.category.name}
                </Link>
              </div>
            )}

            {/* Name */}
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-4">
              <span className="text-3xl font-bold text-gray-900">
                R$ {product.basePrice.toFixed(2)}
              </span>
              {product.isOnSale && product.compareAtPrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    R$ {product.compareAtPrice.toFixed(2)}
                  </span>
                  <span className="rounded-full bg-primary-green px-3 py-1 text-sm font-bold text-white">
                    -{product.discountPercentage}%
                  </span>
                </>
              )}
            </div>

            {/* Points */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-50 border border-purple-100 px-4 py-2 text-primary-purple">
              <Package className="h-5 w-5" />
              <span className="font-medium">
                Ganhe <strong>+{product.loyaltyPoints} pontos</strong> nesta compra
              </span>
            </div>

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
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <Truck className="h-6 w-6 text-primary-green" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Frete Grátis</p>
                  <p className="text-xs text-gray-500">Acima de R$ 150</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <Shield className="h-6 w-6 text-primary-green" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Compra Segura</p>
                  <p className="text-xs text-gray-500">Garantia de 7 dias</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Description */}
        {product.description && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Descrição</h2>
            <div className="rounded-xl bg-white border border-gray-200 p-6">
              <div
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Produtos Relacionados
            </h2>
            <ProductGrid products={relatedProducts} />
          </div>
        )}
      </div>
    </div>
  );
}
