/**
 * Benefits List Component (Admin)
 *
 * Displays a table of all subscription benefits with actions.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  Percent,
  Gift,
  Zap,
  Headset,
  Star,
  Crown,
  Shield,
  Clock,
  Heart,
  Award,
  Sparkles,
  BadgeCheck,
  Package,
  CreditCard,
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  LucideIcon,
} from 'lucide-react';
import type { Benefit } from '@prisma/client';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Truck,
  Percent,
  Gift,
  Zap,
  Headset,
  Star,
  Crown,
  Shield,
  Clock,
  Heart,
  Award,
  Sparkles,
  BadgeCheck,
  Package,
  CreditCard,
};

interface BenefitsListProps {
  benefits: Benefit[];
  onDelete?: (id: string) => Promise<void>;
}

export function BenefitsList({ benefits, onDelete }: BenefitsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName || !iconMap[iconName]) {
      return <Gift className="w-5 h-5" />;
    }
    const IconComponent = iconMap[iconName];
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="bg-card-bg rounded-xl border border-gray-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-border">
        <h2 className="text-lg font-semibold text-text-primary">
          Benefícios ({benefits.length})
        </h2>
        <Link
          href="/admin/benefits/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Benefício
        </Link>
      </div>

      {/* Table */}
      {benefits.length === 0 ? (
        <div className="p-8 text-center">
          <Gift className="w-12 h-12 mx-auto text-text-secondary mb-4" />
          <p className="text-text-secondary">Nenhum benefício cadastrado.</p>
          <Link
            href="/admin/benefits/new"
            className="inline-flex items-center gap-2 mt-4 text-primary-green hover:underline"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro benefício
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Ordem
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Benefício
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-border">
              {benefits.map((benefit) => (
                <tr key={benefit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-text-secondary">
                      {benefit.displayOrder}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-green/10 flex items-center justify-center text-primary-green">
                        {getIcon(benefit.icon)}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{benefit.name}</p>
                        {benefit.description && (
                          <p className="text-sm text-text-secondary line-clamp-1 max-w-xs">
                            {benefit.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {benefit.slug}
                    </code>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {benefit.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <Check className="w-3 h-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        <X className="w-3 h-3" />
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/benefits/${benefit.id}`}
                        className="p-2 text-text-secondary hover:text-primary-green hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {confirmDeleteId === benefit.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(benefit.id)}
                            disabled={deletingId === benefit.id}
                            className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Confirmar exclusão"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-2 text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(benefit.id)}
                          className="p-2 text-text-secondary hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
