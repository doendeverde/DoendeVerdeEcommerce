"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Users, Eye, Shield, Ban, CheckCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { UserRole, UserStatus } from "@prisma/client";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: UserStatus;
  createdAt: Date;
  ordersCount: number;
  totalSpent: number;
}

interface UsersTableProps {
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    status: string;
  };
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  CUSTOMER: "Cliente",
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "Ativo",
  BLOCKED: "Bloqueado",
};

const statusStyles: Record<UserStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  BLOCKED: "bg-red-100 text-red-800",
};

/**
 * Tabela de usuários com filtros
 */
export function UsersTable({ users, pagination, filters }: UsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(filters.search);

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    if (!updates.page) {
      params.delete("page");
    }

    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() });
  };

  const handleStatusToggle = async (userId: string, currentStatus: UserStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    const confirmMessage = currentStatus === "ACTIVE"
      ? "Tem certeza que deseja bloquear este usuário?"
      : "Tem certeza que deseja desbloquear este usuário?";

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Erro ao atualizar status do usuário");
      }
    } catch {
      alert("Erro ao atualizar status do usuário");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-bg border-0 rounded-lg focus:ring-2 focus:ring-primary-purple/20 focus:bg-white transition-colors"
              />
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="px-3 py-2 text-sm bg-gray-bg border-0 rounded-lg focus:ring-2 focus:ring-primary-purple/20"
          >
            <option value="">Todos status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="BLOCKED">Bloqueado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-bg">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Função
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Pedidos
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Cadastro
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
                    <p className="text-text-secondary">Nenhum usuário encontrado</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-bg/50 transition-colors"
                  >
                    {/* User */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-purple/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-purple">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-text-primary">
                          {user.fullName}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-text-secondary">
                        {user.email}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {user.role === "ADMIN" && (
                          <Shield className="w-4 h-4 text-primary-purple" />
                        )}
                        <span className="text-sm text-text-primary">
                          {roleLabels[user.role]}
                        </span>
                      </div>
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-text-primary">
                        {user.ordersCount}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-text-secondary">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          statusStyles[user.status]
                        )}
                      >
                        {statusLabels[user.status]}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="p-2 rounded-lg hover:bg-gray-bg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4 text-text-secondary" />
                        </Link>
                        {user.role !== "ADMIN" && (
                          <button
                            onClick={() => handleStatusToggle(user.id, user.status)}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              user.status === "ACTIVE"
                                ? "hover:bg-red-50 text-red-600"
                                : "hover:bg-green-50 text-green-600"
                            )}
                            title={user.status === "ACTIVE" ? "Bloquear" : "Desbloquear"}
                          >
                            {user.status === "ACTIVE" ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
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
              {pagination.total} usuários
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
