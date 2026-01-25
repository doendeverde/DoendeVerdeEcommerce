import { adminService } from "@/services/admin.service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UsersTable } from "./UsersTable";
import { UserStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  status?: string;
  page?: string;
}

/**
 * Página de listagem de usuários (Admin)
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = params.page ? parseInt(params.page) : 1;
  const status = params.status as UserStatus | undefined;

  const usersData = await adminService.getUsers({
    search: params.search,
    status,
    page,
    pageSize: 10,
  });

  return (
    <div className="page-content">
      <AdminPageHeader
        title="Usuários"
        description={`${usersData.total} usuário(s) cadastrados`}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-default p-4">
          <span className="text-sm text-text-secondary">Total de Usuários</span>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {usersData.total}
          </p>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800 p-4">
          <span className="text-sm text-green-700 dark:text-green-400">Ativos</span>
          <p className="text-2xl font-bold text-green-800 dark:text-green-300 mt-1">
            {usersData.users.filter((u) => u.status === "ACTIVE").length}
          </p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800 p-4">
          <span className="text-sm text-red-700 dark:text-red-400">Bloqueados</span>
          <p className="text-2xl font-bold text-red-800 dark:text-red-300 mt-1">
            {usersData.users.filter((u) => u.status === "BLOCKED").length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <UsersTable
        users={usersData.users}
        pagination={{
          page: usersData.page,
          pageSize: usersData.pageSize,
          total: usersData.total,
          totalPages: usersData.totalPages,
        }}
        filters={{
          search: params.search || "",
          status: params.status || "",
        }}
      />
    </div>
  );
}
