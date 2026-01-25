/**
 * Shipping Profile Form Component
 *
 * Create/Edit shipping profile with dimensions and weight.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Package, Weight, Ruler } from "lucide-react";
import type { ShippingProfile } from "@/types/shipping";

interface ShippingProfileFormProps {
  profile?: ShippingProfile;
}

export function ShippingProfileForm({ profile }: ShippingProfileFormProps) {
  const router = useRouter();
  const isEditing = !!profile;

  const [formData, setFormData] = useState({
    name: profile?.name ?? "",
    weightKg: profile?.weightKg?.toString() ?? "",
    widthCm: profile?.widthCm?.toString() ?? "",
    heightCm: profile?.heightCm?.toString() ?? "",
    lengthCm: profile?.lengthCm?.toString() ?? "",
    isActive: profile?.isActive ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validate
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      setIsSubmitting(false);
      return;
    }

    const weightKg = parseFloat(formData.weightKg);
    const widthCm = parseInt(formData.widthCm, 10);
    const heightCm = parseInt(formData.heightCm, 10);
    const lengthCm = parseInt(formData.lengthCm, 10);

    if (isNaN(weightKg) || weightKg <= 0) {
      setError("Peso deve ser um número maior que zero");
      setIsSubmitting(false);
      return;
    }

    if (isNaN(widthCm) || widthCm <= 0) {
      setError("Largura deve ser um número inteiro maior que zero");
      setIsSubmitting(false);
      return;
    }

    if (isNaN(heightCm) || heightCm <= 0) {
      setError("Altura deve ser um número inteiro maior que zero");
      setIsSubmitting(false);
      return;
    }

    if (isNaN(lengthCm) || lengthCm <= 0) {
      setError("Comprimento deve ser um número inteiro maior que zero");
      setIsSubmitting(false);
      return;
    }

    try {
      const url = isEditing
        ? `/api/admin/shipping-profiles/${profile.id}`
        : "/api/admin/shipping-profiles";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          weightKg,
          widthCm,
          heightCm,
          lengthCm,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/shipping");
        router.refresh();
      } else {
        setError(data.error || "Erro ao salvar perfil");
      }
    } catch {
      setError("Erro ao salvar perfil de frete");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Nome do Perfil *
          </label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Caixa Pequena, Kit Médio..."
              className="w-full pl-10 pr-4 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green"
              required
            />
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Nome descritivo para identificar o perfil
          </p>
        </div>

        {/* Weight */}
        <div>
          <label
            htmlFor="weightKg"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Peso (kg) *
          </label>
          <div className="relative">
            <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="number"
              id="weightKg"
              name="weightKg"
              value={formData.weightKg}
              onChange={handleChange}
              placeholder="0.5"
              step="0.001"
              min="0.001"
              max="30"
              className="w-full pl-10 pr-4 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green"
              required
            />
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Peso total do pacote em quilogramas (máx: 30kg)
          </p>
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Dimensões (cm) *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {/* Width */}
            <div>
              <label
                htmlFor="widthCm"
                className="block text-xs text-text-muted mb-1"
              >
                Largura
              </label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="number"
                  id="widthCm"
                  name="widthCm"
                  value={formData.widthCm}
                  onChange={handleChange}
                  placeholder="20"
                  min="1"
                  max="100"
                  className="w-full pl-9 pr-4 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green"
                  required
                />
              </div>
            </div>

            {/* Height */}
            <div>
              <label
                htmlFor="heightCm"
                className="block text-xs text-text-muted mb-1"
              >
                Altura
              </label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted rotate-90" />
                <input
                  type="number"
                  id="heightCm"
                  name="heightCm"
                  value={formData.heightCm}
                  onChange={handleChange}
                  placeholder="10"
                  min="1"
                  max="100"
                  className="w-full pl-9 pr-4 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green"
                  required
                />
              </div>
            </div>

            {/* Length */}
            <div>
              <label
                htmlFor="lengthCm"
                className="block text-xs text-text-muted mb-1"
              >
                Comprimento
              </label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted -rotate-45" />
                <input
                  type="number"
                  id="lengthCm"
                  name="lengthCm"
                  value={formData.lengthCm}
                  onChange={handleChange}
                  placeholder="30"
                  min="1"
                  max="100"
                  className="w-full pl-9 pr-4 py-2 border border-gray-border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green"
                  required
                />
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Dimensões do pacote em centímetros (máx: 100cm cada)
          </p>
        </div>

        {/* Active status */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 text-primary-green border-gray-border rounded focus:ring-primary-green"
          />
          <label htmlFor="isActive" className="text-sm text-text-primary">
            Perfil ativo
          </label>
        </div>
      </div>

      {/* Preview card */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-text-primary mb-2">
          Pré-visualização
        </h3>
        <div className="flex items-center gap-6 text-sm text-text-secondary">
          <div>
            <span className="text-text-muted">Peso:</span>{" "}
            <span className="font-medium">
              {formData.weightKg || "0"} kg
            </span>
          </div>
          <div>
            <span className="text-text-muted">Volume:</span>{" "}
            <span className="font-medium">
              {formData.widthCm || "0"} × {formData.heightCm || "0"} ×{" "}
              {formData.lengthCm || "0"} cm
            </span>
          </div>
          <div>
            <span className="text-text-muted">Status:</span>{" "}
            <span
              className={`font-medium ${formData.isActive ? "text-green-600" : "text-gray-500"}`}
            >
              {formData.isActive ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-text-secondary hover:text-text-primary border border-gray-border rounded-lg hover:bg-hover-bg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green/90 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? "Salvar Alterações" : "Criar Perfil"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
