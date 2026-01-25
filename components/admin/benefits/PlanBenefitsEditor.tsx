/**
 * Plan Benefits Editor Component (Admin)
 *
 * Allows toggling benefits for a subscription plan.
 */

'use client';

import { useState, useEffect } from 'react';
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
  Save,
  Loader2,
  Check,
  X,
  LucideIcon,
} from 'lucide-react';

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

interface PlanBenefit {
  id: string;
  benefitId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  enabled: boolean;
  customValue: string | null;
}

interface PlanBenefitsEditorProps {
  planId: string;
  planName: string;
  initialBenefits?: PlanBenefit[];
  onSave?: () => void;
}

export function PlanBenefitsEditor({
  planId,
  planName,
  initialBenefits = [],
  onSave,
}: PlanBenefitsEditorProps) {
  const [benefits, setBenefits] = useState<PlanBenefit[]>(initialBenefits);
  const [isLoading, setIsLoading] = useState(!initialBenefits.length);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load benefits if not provided
  useEffect(() => {
    if (initialBenefits.length) return;

    async function loadBenefits() {
      try {
        const res = await fetch(`/api/admin/subscriptions/${planId}/benefits`);
        if (!res.ok) throw new Error('Erro ao carregar benefícios');
        const data = await res.json();
        setBenefits(data.benefits);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
      } finally {
        setIsLoading(false);
      }
    }

    loadBenefits();
  }, [planId, initialBenefits.length]);

  const getIcon = (iconName: string | null) => {
    if (!iconName || !iconMap[iconName]) {
      return <Gift className="w-5 h-5" />;
    }
    const IconComponent = iconMap[iconName];
    return <IconComponent className="w-5 h-5" />;
  };

  const handleToggle = (benefitId: string) => {
    setBenefits((prev) =>
      prev.map((b) =>
        b.benefitId === benefitId ? { ...b, enabled: !b.enabled } : b
      )
    );
    setHasChanges(true);
    setSuccess(false);
  };

  const handleCustomValueChange = (benefitId: string, value: string) => {
    setBenefits((prev) =>
      prev.map((b) =>
        b.benefitId === benefitId ? { ...b, customValue: value || null } : b
      )
    );
    setHasChanges(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/subscriptions/${planId}/benefits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          benefits: benefits.map((b) => ({
            benefitId: b.benefitId,
            enabled: b.enabled,
            customValue: b.customValue,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar');
      }

      setSuccess(true);
      setHasChanges(false);
      onSave?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card-bg rounded-xl border border-gray-border p-8">
        <div className="flex items-center justify-center gap-2 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando benefícios...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg rounded-xl border border-gray-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-border">
        <h3 className="text-lg font-semibold text-text-primary">
          Benefícios do Plano
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Configure quais benefícios estão incluídos no plano {planName}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mx-4 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          Benefícios salvos com sucesso!
        </div>
      )}

      {/* Benefits List */}
      <div className="divide-y divide-gray-border">
        {benefits.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Nenhum benefício cadastrado.</p>
            <p className="text-sm">Cadastre benefícios primeiro em Benefícios → Novo.</p>
          </div>
        ) : (
          benefits.map((benefit) => (
            <div
              key={benefit.benefitId}
              className={`p-4 flex items-center gap-4 transition-colors ${benefit.enabled ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                }`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${benefit.enabled
                    ? 'bg-primary-green/10 text-primary-green'
                    : 'bg-gray-100 dark:bg-gray-800 text-text-secondary'
                  }`}
              >
                {getIcon(benefit.icon)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${benefit.enabled ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {benefit.name}
                </p>
                {benefit.description && (
                  <p className="text-sm text-text-secondary line-clamp-1">
                    {benefit.description}
                  </p>
                )}
              </div>

              {/* Custom Value (if enabled) */}
              {benefit.enabled && (
                <div className="w-32">
                  <input
                    type="text"
                    value={benefit.customValue || ''}
                    onChange={(e) => handleCustomValueChange(benefit.benefitId, e.target.value)}
                    placeholder="Valor"
                    className="input-default w-full text-sm py-1.5"
                  />
                </div>
              )}

              {/* Toggle */}
              <button
                type="button"
                onClick={() => handleToggle(benefit.benefitId)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${benefit.enabled ? 'bg-primary-green' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${benefit.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {benefits.length > 0 && (
        <div className="p-4 border-t border-gray-border flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            {benefits.filter((b) => b.enabled).length} de {benefits.length} benefícios ativos
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
