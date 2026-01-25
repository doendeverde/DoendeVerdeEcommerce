"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Palette, Star } from "lucide-react";
import Link from "next/link";
import { ShippingProfileSelector } from "@/components/admin/shipping";
import { PlanBenefitsEditor } from "@/components/admin/benefits";

// Color scheme interface
interface ColorScheme {
  primary: string;
  text: string;
  primaryDark: string;
  textDark: string;
  badge?: string;
  icon?: string;
}

// Default color presets
const COLOR_PRESETS: Record<string, ColorScheme> = {
  green: {
    primary: "#22C55E",
    text: "#FFFFFF",
    primaryDark: "#16A34A",
    textDark: "#FFFFFF",
    badge: "#22C55E",
  },
  purple: {
    primary: "#8B5CF6",
    text: "#FFFFFF",
    primaryDark: "#7C3AED",
    textDark: "#FFFFFF",
    badge: "#8B5CF6",
  },
  blue: {
    primary: "#3B82F6",
    text: "#FFFFFF",
    primaryDark: "#2563EB",
    textDark: "#FFFFFF",
    badge: "#3B82F6",
  },
  amber: {
    primary: "#F59E0B",
    text: "#1F2937",
    primaryDark: "#D97706",
    textDark: "#1F2937",
    badge: "#F59E0B",
  },
  gray: {
    primary: "#6B7280",
    text: "#FFFFFF",
    primaryDark: "#4B5563",
    textDark: "#FFFFFF",
  },
};

interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPercent: number;
  billingCycle: "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";
  colorScheme: ColorScheme | null;
  isActive: boolean;
  isFeatured: boolean;
  shippingProfileId: string | null;
}

interface PlanFormProps {
  initialData?: PlanFormData & { id: string };
  mode: "create" | "edit";
}

/**
 * Gera slug a partir do nome
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Formata valor para exibição
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function SubscriptionPlanForm({ initialData, mode }: PlanFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    shortDescription: initialData?.shortDescription || "",
    price: initialData?.price || 0,
    discountPercent: initialData?.discountPercent || 0,
    billingCycle: initialData?.billingCycle || "MONTHLY",
    colorScheme: initialData?.colorScheme || COLOR_PRESETS.green,
    isActive: initialData?.isActive ?? true,
    isFeatured: initialData?.isFeatured ?? false,
    shippingProfileId: initialData?.shippingProfileId ?? null,
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name) ? generateSlug(name) : prev.slug,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? parseFloat(value) || 0
            : value,
    }));
  };

  const handleColorPreset = (presetKey: string) => {
    setFormData((prev) => ({
      ...prev,
      colorScheme: COLOR_PRESETS[presetKey],
    }));
  };

  const handleColorChange = (field: keyof ColorScheme, value: string) => {
    setFormData((prev) => ({
      ...prev,
      colorScheme: {
        ...(prev.colorScheme || COLOR_PRESETS.green),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url =
        mode === "create"
          ? "/api/admin/subscription-plans"
          : `/api/admin/subscription-plans/${initialData?.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug: formData.slug || generateSlug(formData.name),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar plano");
      }

      router.push("/admin/subscriptions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/subscriptions"
          className="p-2 hover:bg-hover-bg rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-default">
            {mode === "create" ? "Novo Plano de Assinatura" : "Editar Plano"}
          </h1>
          <p className="text-muted text-sm">
            {mode === "create"
              ? "Preencha os dados para criar um novo plano"
              : `Editando: ${initialData?.name}`}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Básicas */}
            <div className="bg-card-bg rounded-xl border border-gray-border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Informações Básicas</h2>

              {/* Nome */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-lg text-text-primary placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Ex: Plano Premium"
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-text-secondary mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-lg text-text-primary placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="plano-premium"
                />
              </div>

              {/* Descrição Curta */}
              <div>
                <label htmlFor="shortDescription" className="block text-sm font-medium text-text-secondary mb-2">
                  Descrição Curta
                </label>
                <input
                  type="text"
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-lg text-text-primary placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Uma frase resumindo o plano"
                />
              </div>

              {/* Descrição Completa */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-2">
                  Descrição Completa
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-lg text-text-primary placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                  placeholder="Descrição detalhada do plano..."
                />
              </div>
            </div>

            {/* Preço e Ciclo */}
            <div className="bg-card-bg rounded-xl border border-gray-border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Preço e Ciclo de Cobrança</h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Preço */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-text-secondary mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-lg text-text-primary placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                  <p className="mt-1 text-xs text-text-secondary">
                    {formData.price > 0 && `Valor: ${formatCurrency(formData.price)}`}
                  </p>
                </div>

                {/* Ciclo */}
                <div>
                  <label htmlFor="billingCycle" className="block text-sm font-medium text-text-secondary mb-2">
                    Ciclo de Cobrança
                  </label>
                  <select
                    id="billingCycle"
                    name="billingCycle"
                    value={formData.billingCycle}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-bg border border-gray-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="MONTHLY">Mensal</option>
                    <option value="QUARTERLY">Trimestral</option>
                    <option value="SEMIANNUAL">Semestral</option>
                    <option value="ANNUAL">Anual</option>
                  </select>
                </div>
              </div>

              {/* Desconto em Produtos */}
              <div>
                <label htmlFor="discountPercent" className="block text-sm font-medium text-text-secondary mb-2">
                  Desconto em Produtos (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    id="discountPercent"
                    name="discountPercent"
                    value={formData.discountPercent}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="1"
                    className="w-32 px-4 py-3 bg-gray-bg border border-gray-border rounded-lg text-text-primary placeholder-gray-muted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                  <span className="text-text-secondary">%</span>
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  Percentual de desconto que assinantes deste plano terão em todas as compras de produtos.
                </p>
              </div>
            </div>

            {/* Color Scheme */}
            <div className="bg-card-bg rounded-xl border border-gray-border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-text-secondary" />
                <h2 className="text-lg font-semibold text-text-primary">Cores do Plano</h2>
              </div>
              <p className="text-sm text-text-secondary">
                Defina as cores que serão usadas para exibir este plano no site.
              </p>

              {/* Presets */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Presets
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleColorPreset(key)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-border hover:border-gray-muted transition-colors"
                      style={{ borderColor: formData.colorScheme?.primary === preset.primary ? preset.primary : undefined }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <span className="text-sm text-text-secondary capitalize">{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Cor Principal (Light)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.colorScheme?.primary || "#22C55E"}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="w-12 h-10 rounded border border-gray-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.colorScheme?.primary || "#22C55E"}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-bg border border-gray-border rounded-lg text-text-primary text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Cor do Texto (Light)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.colorScheme?.text || "#FFFFFF"}
                      onChange={(e) => handleColorChange("text", e.target.value)}
                      className="w-12 h-10 rounded border border-gray-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.colorScheme?.text || "#FFFFFF"}
                      onChange={(e) => handleColorChange("text", e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-bg border border-gray-border rounded-lg text-text-primary text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Cor Principal (Dark)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.colorScheme?.primaryDark || "#16A34A"}
                      onChange={(e) => handleColorChange("primaryDark", e.target.value)}
                      className="w-12 h-10 rounded border border-gray-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.colorScheme?.primaryDark || "#16A34A"}
                      onChange={(e) => handleColorChange("primaryDark", e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-bg border border-gray-border rounded-lg text-text-primary text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Cor do Texto (Dark)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.colorScheme?.textDark || "#FFFFFF"}
                      onChange={(e) => handleColorChange("textDark", e.target.value)}
                      className="w-12 h-10 rounded border border-gray-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.colorScheme?.textDark || "#FFFFFF"}
                      onChange={(e) => handleColorChange("textDark", e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-bg border border-gray-border rounded-lg text-text-primary text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Preview
                </label>
                <div className="flex gap-4">
                  <div
                    className="flex-1 p-4 rounded-lg text-center"
                    style={{
                      backgroundColor: formData.colorScheme?.primary || "#22C55E",
                      color: formData.colorScheme?.text || "#FFFFFF",
                    }}
                  >
                    <span className="font-medium">Light Mode</span>
                  </div>
                  <div
                    className="flex-1 p-4 rounded-lg text-center"
                    style={{
                      backgroundColor: formData.colorScheme?.primaryDark || "#16A34A",
                      color: formData.colorScheme?.textDark || "#FFFFFF",
                    }}
                  >
                    <span className="font-medium">Dark Mode</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefícios do Sistema (apenas no modo de edição) */}
            {mode === "edit" && initialData?.id && (
              <PlanBenefitsEditor planId={initialData.id} planName={initialData.name} />
            )}
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-card-bg rounded-xl border border-gray-border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Status</h2>

              {/* Ativo */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-muted rounded-full peer peer-checked:bg-green-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
                <span className="text-text-secondary">Plano ativo</span>
              </label>

              {/* Destaque */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-muted rounded-full peer peer-checked:bg-purple-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">Plano em destaque</span>
                  <Star className="w-4 h-4 text-purple-400" />
                </div>
              </label>
            </div>

            {/* Shipping Profile */}
            <div className="bg-card-bg rounded-xl border border-gray-border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Frete</h2>
              <p className="text-sm text-text-secondary">
                Selecione um perfil de frete para calcular o envio dos kits desta assinatura.
              </p>
              <ShippingProfileSelector
                value={formData.shippingProfileId}
                onChange={(profileId: string | null) =>
                  setFormData((prev) => ({ ...prev, shippingProfileId: profileId }))
                }
              />
            </div>

            {/* Preview do Preço */}
            <div
              className="rounded-xl border p-6"
              style={{
                background: `linear-gradient(135deg, ${formData.colorScheme?.primary || "#22C55E"}20, ${formData.colorScheme?.primaryDark || "#16A34A"}20)`,
                borderColor: `${formData.colorScheme?.primary || "#22C55E"}50`,
              }}
            >
              <h2 className="text-lg font-semibold text-text-primary mb-2">Preview do Card</h2>
              <div className="text-center">
                <p className="text-2xl font-bold text-text-primary">{formData.name || "Nome do Plano"}</p>
                <p className="text-sm text-text-secondary mt-1">
                  {formData.billingCycle === "MONTHLY"
                    ? "por mês"
                    : formData.billingCycle === "QUARTERLY"
                      ? "por trimestre"
                      : formData.billingCycle === "SEMIANNUAL"
                        ? "por semestre"
                        : "por ano"}
                </p>
                <p className="text-3xl font-bold text-text-primary mt-2">
                  {formatCurrency(formData.price)}
                </p>
                {formData.discountPercent > 0 && (
                  <span
                    className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${formData.colorScheme?.primary || "#22C55E"}20`,
                      color: formData.colorScheme?.primary || "#22C55E",
                    }}
                  >
                    {formData.discountPercent}% de desconto em produtos
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-border">
          <Link
            href="/admin/subscriptions"
            className="px-6 py-3 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {mode === "create" ? "Criar Plano" : "Salvar Alterações"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
