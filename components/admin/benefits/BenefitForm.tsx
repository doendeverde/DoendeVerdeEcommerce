/**
 * Benefit Form Component (Admin)
 *
 * Form for creating and editing subscription benefits.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowLeft,
  Loader2,
  LucideIcon,
} from 'lucide-react';
import type { Benefit } from '@prisma/client';
import { ALLOWED_BENEFIT_ICONS } from '@/types/benefit';

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

interface BenefitFormProps {
  benefit?: Benefit;
  onSubmit: (data: BenefitFormData) => Promise<void>;
}

export interface BenefitFormData {
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  displayOrder: number;
}

export function BenefitForm({ benefit, onSubmit }: BenefitFormProps) {
  const router = useRouter();
  const isEdit = !!benefit;

  const [formData, setFormData] = useState<BenefitFormData>({
    name: benefit?.name || '',
    slug: benefit?.slug || '',
    description: benefit?.description || '',
    icon: benefit?.icon || 'Gift',
    isActive: benefit?.isActive ?? true,
    displayOrder: benefit?.displayOrder ?? 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      // Only auto-generate slug for new benefits
      slug: isEdit ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        description: formData.description || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar benefício');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-card-bg rounded-xl border border-gray-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Informações Básicas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
              Nome *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              required
              maxLength={100}
              className="input-default w-full"
              placeholder="Ex: Frete Grátis"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-text-primary mb-2">
              Slug *
            </label>
            <input
              type="text"
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              required
              maxLength={100}
              pattern="^[a-z0-9-]+$"
              className="input-default w-full font-mono"
              placeholder="frete-gratis"
            />
            <p className="mt-1 text-xs text-text-secondary">
              Apenas letras minúsculas, números e hífens
            </p>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              maxLength={500}
              rows={3}
              className="input-default w-full resize-none"
              placeholder="Descrição detalhada do benefício..."
            />
          </div>

          {/* Display Order */}
          <div>
            <label htmlFor="displayOrder" className="block text-sm font-medium text-text-primary mb-2">
              Ordem de Exibição
            </label>
            <input
              type="number"
              id="displayOrder"
              value={formData.displayOrder}
              onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
              min={0}
              className="input-default w-full"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Status
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-border text-primary-green focus:ring-primary-green/20"
              />
              <span className="text-text-primary">Ativo</span>
            </label>
          </div>
        </div>
      </div>

      {/* Icon Selection */}
      <div className="bg-card-bg rounded-xl border border-gray-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Ícone
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Selecione um ícone para representar este benefício
        </p>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
          {ALLOWED_BENEFIT_ICONS.map((iconName) => {
            const IconComponent = iconMap[iconName];
            const isSelected = formData.icon === iconName;

            return (
              <button
                key={iconName}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, icon: iconName }))}
                className={`p-3 rounded-lg border-2 transition-all ${isSelected
                    ? 'border-primary-green bg-primary-green/10 text-primary-green'
                    : 'border-gray-border hover:border-primary-green/50 text-text-secondary hover:text-text-primary'
                  }`}
                title={iconName}
              >
                <IconComponent className="w-5 h-5 mx-auto" />
              </button>
            );
          })}
        </div>

        {formData.icon && (
          <p className="mt-4 text-sm text-text-secondary">
            Ícone selecionado: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{formData.icon}</code>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEdit ? 'Salvar Alterações' : 'Criar Benefício'}
        </button>
      </div>
    </form>
  );
}
