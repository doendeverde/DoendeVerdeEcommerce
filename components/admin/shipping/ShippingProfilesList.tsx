/**
 * Shipping Profiles List Component
 *
 * Displays all shipping profiles with actions.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Weight,
  Ruler,
  Box,
} from "lucide-react";
import type { ShippingProfileWithRelations } from "@/types/shipping";

export function ShippingProfilesList() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ShippingProfileWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch profiles
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/admin/shipping-profiles");
      const data = await response.json();

      if (data.success) {
        setProfiles(data.data);
      } else {
        setError(data.error || "Erro ao carregar perfis");
      }
    } catch {
      setError("Erro ao carregar perfis de frete");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(
        `/api/admin/shipping-profiles/${id}/toggle-active`,
        { method: "POST" }
      );
      const data = await response.json();

      if (data.success) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, isActive: data.data.isActive } : p
          )
        );
      } else {
        alert(data.error || "Erro ao alterar status");
      }
    } catch {
      alert("Erro ao alterar status");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete profile
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir o perfil "${name}"?`)) return;

    setActionLoading(id);
    try {
      const response = await fetch(`/api/admin/shipping-profiles/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        setProfiles((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || "Erro ao excluir perfil");
      }
    } catch {
      alert("Erro ao excluir perfil");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg shadow-sm p-8 text-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gray-bg rounded-full" />
          <div className="h-4 w-32 bg-gray-bg rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface rounded-lg shadow-sm p-8">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-sm p-8 text-center">
        <Package className="w-12 h-12 text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">
          Nenhum perfil de frete
        </h3>
        <p className="text-text-secondary mb-4">
          Crie perfis de frete para associar a produtos e planos de assinatura.
        </p>
        <Link
          href="/admin/shipping/new"
          className="inline-flex items-center px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green/90"
        >
          Criar Primeiro Perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-bg border-b border-default">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Dimensões
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Peso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Uso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {profiles.map((profile) => {
              const totalUsage =
                (profile._count?.products ?? 0) +
                (profile._count?.subscriptionPlans ?? 0);

              return (
                <tr
                  key={profile.id}
                  className={`hover-bg ${!profile.isActive ? "opacity-60" : ""}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-green/10 rounded-lg flex items-center justify-center">
                        <Box className="w-5 h-5 text-primary-green" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          {profile.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <Ruler className="w-4 h-4" />
                      <span>
                        {profile.widthCm} × {profile.heightCm} ×{" "}
                        {profile.lengthCm} cm
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <Weight className="w-4 h-4" />
                      <span>{profile.weightKg} kg</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className="text-text-primary font-medium">
                        {totalUsage}
                      </span>
                      <span className="text-text-muted"> item(s)</span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {profile._count?.products ?? 0} prod. |{" "}
                      {profile._count?.subscriptionPlans ?? 0} planos
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(profile.id)}
                      disabled={actionLoading === profile.id}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${profile.isActive
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        }`}
                    >
                      {profile.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/shipping/${profile.id}`}
                        className="p-2 text-text-secondary hover:text-primary-green hover:bg-primary-green/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(profile.id, profile.name)}
                        disabled={actionLoading === profile.id || totalUsage > 0}
                        className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          totalUsage > 0
                            ? "Não pode excluir - em uso"
                            : "Excluir"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
