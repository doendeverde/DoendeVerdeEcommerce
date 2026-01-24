import { adminService } from "@/services/admin.service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductsTable } from "./ProductsTable";
import { ProductStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  category?: string;
  status?: string;
  lowStock?: string;
  page?: string;
}

/**
 * Página de listagem de produtos (Admin)
 * Inclui busca, filtros e paginação
 */
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = params.page ? parseInt(params.page) : 1;
  const status = params.status as ProductStatus | undefined;

  const [productsData, categories] = await Promise.all([
    adminService.getProducts({
      search: params.search,
      categoryId: params.category,
      status,
      page,
      pageSize: 10,
    }),
    adminService.getCategories(),
  ]);

  // Stats summary
  const totalProducts = productsData.total;
  const activeCount = productsData.products.filter(
    (p) => p.status === "ACTIVE"
  ).length;
  const lowStockCount = productsData.products.filter((p) => p.isLowStock).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Produtos"
        description={`${totalProducts} produto(s) cadastrados`}
        action={{
          label: "Novo Produto",
          href: "/admin/products/new",
        }}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-default p-4">
          <span className="text-sm text-text-secondary">Total de Produtos</span>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {totalProducts}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-default p-4">
          <span className="text-sm text-text-secondary">Em Estoque</span>
          <p className="text-2xl font-bold text-primary-green mt-1">
            {activeCount}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-default p-4">
          <span className="text-sm text-text-secondary">Estoque Baixo</span>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {lowStockCount}
          </p>
        </div>
      </div>

      {/* Products Table with Filters */}
      <ProductsTable
        products={productsData.products}
        categories={categories}
        pagination={{
          page: productsData.page,
          pageSize: productsData.pageSize,
          total: productsData.total,
          totalPages: productsData.totalPages,
        }}
        filters={{
          search: params.search || "",
          category: params.category || "",
          status: params.status || "",
        }}
      />
    </div>
  );
}
