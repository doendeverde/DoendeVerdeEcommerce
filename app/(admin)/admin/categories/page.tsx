import { adminService } from "@/services/admin.service";
import { Tag, Package, Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { CategoryDeleteButton } from "@/components/admin/categories/CategoryDeleteButton";

export const dynamic = "force-dynamic";

/**
 * Página de categorias (Admin)
 * Listagem com CRUD completo de categorias
 */
export default async function AdminCategoriesPage() {
  const categories = await adminService.getCategories();

  return (
    <div className="space-y-6">
      {/* Header com botão de criar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorias</h1>
          <p className="text-neutral-400 text-sm">
            {categories.length} categoria(s) cadastrada(s)
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Link>
      </div>

      {/* Tabela de categorias */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Produtos
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Tag className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400 mb-4">Nenhuma categoria cadastrada</p>
                    <Link
                      href="/admin/categories/new"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Criar primeira categoria
                    </Link>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {category.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center">
                            <Tag className="w-5 h-5 text-neutral-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">
                            {category.name}
                          </p>
                          {category.description && (
                            <p className="text-xs text-neutral-400 truncate max-w-xs">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-neutral-400 font-mono bg-neutral-800 px-2 py-1 rounded">
                        {category.slug}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/products?category=${category.id}`}
                        className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        {category.productsCount} produto(s)
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${category.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-neutral-700 text-neutral-400"
                          }`}
                      >
                        {category.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/categories/${category.id}`}
                          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <CategoryDeleteButton
                          categoryId={category.id}
                          categoryName={category.name}
                          productsCount={category.productsCount}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
