"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductStatus } from "@prisma/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  stock: number;
  lowStockAlert: number;
  status: ProductStatus;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
  isLowStock: boolean;
  createdAt: Date;
  /** Data do soft delete. null = produto ativo */
  deletedAt: Date | null;
  /** True se produto está soft-deleted */
  isDeleted: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productsCount: number;
}

interface ProductsTableProps {
  products: Product[];
  categories: Category[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    category: string;
    status: string;
  };
}

const statusLabels: Record<ProductStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  OUT_OF_STOCK: "Sem estoque",
  DISCONTINUED: "Descontinuado",
};

const statusStyles: Record<ProductStatus, string> = {
  DRAFT: "bg-gray-bg text-muted",
  ACTIVE: "bg-green-bg text-green-text",
  OUT_OF_STOCK: "bg-yellow-bg text-yellow-text",
  DISCONTINUED: "bg-red-bg text-red-text",
};

/**
 * Tabela de produtos com filtros interativos
 * Client component para gerenciar estado dos filtros
 */
export function ProductsTable({
  products,
  categories,
  pagination,
  filters,
}: ProductsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);

  // Sync local search state with filters from URL
  useEffect(() => {
    setSearch(filters.search);
  }, [filters.search]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Update URL with filters
  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    if (!updates.page) {
      params.delete("page");
    }

    router.push(`/admin/products?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() });
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Deseja desativar o produto "${productName}"?\n\nO produto não será excluído permanentemente e não aparecerá mais na loja.`)) return;

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Produto desativado com sucesso");
        router.refresh();
      } else {
        toast.error(data.error || "Erro ao desativar produto");
      }
    } catch {
      toast.error("Erro ao desativar produto");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-surface rounded-xl border border-default p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-bg border-0 rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:bg-surface transition-colors"
              />
            </div>
          </form>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => updateFilters({ category: e.target.value })}
            className="px-3 py-2 text-sm bg-gray-bg border-0 rounded-lg focus:ring-2 focus:ring-primary-purple/20"
          >
            <option value="">Todas categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.productsCount})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="px-3 py-2 text-sm bg-gray-bg border-0 rounded-lg focus:ring-2 focus:ring-primary-purple/20"
          >
            <option value="">Todos status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="DRAFT">Rascunho</option>
            <option value="OUT_OF_STOCK">Sem estoque</option>
            <option value="DISCONTINUED">Descontinuado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-bg">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Estoque
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
                    <p className="text-text-secondary">Nenhum produto encontrado</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className={cn(
                      "hover:bg-gray-bg/50 transition-colors",
                      product.isDeleted && "opacity-50 bg-red-50/30"
                    )}
                  >
                    {/* Product */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className={cn(
                              "w-10 h-10 rounded-lg object-cover",
                              product.isDeleted && "grayscale"
                            )}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-bg rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-text-secondary" />
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className={cn(
                              "text-sm font-medium hover:text-primary-purple",
                              product.isDeleted ? "text-text-secondary line-through" : "text-text-primary"
                            )}
                          >
                            {product.name}
                          </Link>
                          {product.isDeleted && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                              Desativado
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-text-secondary">
                        {product.categoryName}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-text-primary">
                        {formatCurrency(product.basePrice)}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            product.isLowStock ? "text-orange-600" : "text-text-primary"
                          )}
                        >
                          {product.stock}
                        </span>
                        {product.isLowStock && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          statusStyles[product.status]
                        )}
                      >
                        {statusLabels[product.status]}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenu(activeMenu === product.id ? null : product.id)
                          }
                          className="p-1.5 rounded-lg hover:bg-gray-bg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-text-secondary" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenu === product.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveMenu(null)}
                            />
                            <div className="absolute right-0 mt-1 w-40 bg-surface rounded-lg shadow-lg border border-default z-20">
                              <Link
                                href={`/products/${product.slug}`}
                                target="_blank"
                                className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-bg"
                                onClick={() => setActiveMenu(null)}
                              >
                                <Eye className="w-4 h-4" />
                                Ver na loja
                              </Link>
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-bg"
                                onClick={() => setActiveMenu(null)}
                              >
                                <Pencil className="w-4 h-4" />
                                Editar
                              </Link>
                              {!product.isDeleted && (
                                <button
                                  onClick={() => {
                                    setActiveMenu(null);
                                    handleDelete(product.id, product.name);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Desativar
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-border">
            <span className="text-sm text-text-secondary">
              Mostrando {(pagination.page - 1) * pagination.pageSize + 1} a{" "}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{" "}
              {pagination.total} produtos
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm border border-gray-border rounded-lg hover:bg-gray-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-text-primary">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-border rounded-lg hover:bg-gray-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
