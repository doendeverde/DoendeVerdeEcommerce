/**
 * Preferences Form Modal Component
 * 
 * Full-featured modal for creating/editing user preferences.
 * Reuses form logic from checkout PreferencesStep.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Loader2, Settings, ArrowRight } from "lucide-react";
import type {
  UserPreferencesData,
  PreferencesFormData,
  ConsumptionFrequency,
  ConsumptionMoment,
  PaperType,
  PaperSize,
  FilterPaperSize,
  GlassFilterSize,
  GlassFilterThickness,
  TobaccoUsage,
} from "@/types/subscription-checkout";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PreferencesFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: UserPreferencesData) => void;
  initialPreferences: UserPreferencesData | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CONSUMPTION_MOMENTS: { value: ConsumptionMoment; label: string }[] = [
  { value: "MORNING", label: "Manhã" },
  { value: "AFTERNOON", label: "Tarde" },
  { value: "NIGHT", label: "Noite" },
  { value: "WEEKEND", label: "Final de semana" },
];

const CONSUMPTION_TYPES = [
  { field: "consumesFlower" as const, label: "Flor" },
  { field: "consumesSkunk" as const, label: "Skunk" },
  { field: "consumesHash" as const, label: "Hash" },
  { field: "consumesExtracts" as const, label: "Extratos" },
  { field: "consumesOilEdibles" as const, label: "Óleos/Comestíveis" },
];

const INTERESTS = [
  { field: "likesAccessories" as const, label: "Acessórios" },
  { field: "likesCollectibles" as const, label: "Colecionáveis" },
  { field: "likesPremiumItems" as const, label: "Itens Premium" },
];

const FAVORITE_COLORS = ["Verde", "Preto", "Roxo", "Azul", "Vermelho", "Amarelo", "Rosa", "Branco"];

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function createInitialFormState(preferences: UserPreferencesData | null): PreferencesFormData {
  return {
    yearsSmoking: preferences?.yearsSmoking ?? null,
    favoritePaperType: preferences?.favoritePaperType ?? null,
    favoritePaperSize: preferences?.favoritePaperSize ?? null,
    paperFilterSize: preferences?.paperFilterSize ?? null,
    glassFilterSize: preferences?.glassFilterSize ?? null,
    glassFilterThickness: preferences?.glassFilterThickness ?? null,
    favoriteColors: preferences?.favoriteColors ?? [],
    tobaccoUsage: preferences?.tobaccoUsage ?? null,
    consumptionFrequency: preferences?.consumptionFrequency ?? null,
    consumptionMoment: preferences?.consumptionMoment ?? [],
    consumesFlower: preferences?.consumesFlower ?? false,
    consumesSkunk: preferences?.consumesSkunk ?? false,
    consumesHash: preferences?.consumesHash ?? false,
    consumesExtracts: preferences?.consumesExtracts ?? false,
    consumesOilEdibles: preferences?.consumesOilEdibles ?? false,
    likesAccessories: preferences?.likesAccessories ?? false,
    likesCollectibles: preferences?.likesCollectibles ?? false,
    likesPremiumItems: preferences?.likesPremiumItems ?? false,
    notes: preferences?.notes ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PreferencesFormModal({
  isOpen,
  onClose,
  onSave,
  initialPreferences,
}: PreferencesFormModalProps) {
  const [form, setForm] = useState<PreferencesFormData>(() =>
    createInitialFormState(initialPreferences)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(createInitialFormState(initialPreferences));
      setError(null);
    }
  }, [isOpen, initialPreferences]);

  const handleChange = useCallback(<K extends keyof PreferencesFormData>(
    field: K,
    value: PreferencesFormData[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleMomentToggle = useCallback((moment: ConsumptionMoment, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      consumptionMoment: checked
        ? [...prev.consumptionMoment, moment]
        : prev.consumptionMoment.filter(m => m !== moment),
    }));
  }, []);

  const handleColorToggle = useCallback((color: string, checked: boolean) => {
    const colorLower = color.toLowerCase();
    setForm(prev => ({
      ...prev,
      favoriteColors: checked
        ? [...prev.favoriteColors, colorLower]
        : prev.favoriteColors.filter(c => c !== colorLower),
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/preferences", {
        method: initialPreferences ? "PATCH" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao salvar preferências");
        return;
      }

      onSave(result.data);
      onClose();
    } catch {
      setError("Erro ao salvar preferências. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [form, initialPreferences, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-green" />
            {initialPreferences ? "Editar Preferências" : "Definir Preferências"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Consumption Section */}
          <section className="space-y-4">
            <h3 className="font-medium text-gray-800 border-b pb-2">Sobre seu consumo</h3>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequência de consumo
              </label>
              <select
                value={form.consumptionFrequency ?? ""}
                onChange={(e) =>
                  handleChange("consumptionFrequency", (e.target.value as ConsumptionFrequency) || null)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="OCCASIONAL">Ocasional</option>
                <option value="WEEKLY">Semanal</option>
                <option value="DAILY">Diário</option>
                <option value="HEAVY">Frequente</option>
              </select>
            </div>

            {/* Moments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quando você costuma consumir?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CONSUMPTION_MOMENTS.map((moment) => (
                  <label
                    key={moment.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.consumptionMoment.includes(moment.value)
                      ? "border-primary-green bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.consumptionMoment.includes(moment.value)}
                      onChange={(e) => handleMomentToggle(moment.value, e.target.checked)}
                      className="text-primary-green focus:ring-primary-green rounded"
                    />
                    <span className="text-sm text-gray-700">{moment.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Years */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Há quantos anos você fuma?
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.yearsSmoking ?? ""}
                onChange={(e) =>
                  handleChange("yearsSmoking", e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="Ex: 5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              />
            </div>
          </section>

          {/* What You Consume */}
          <section className="space-y-4">
            <h3 className="font-medium text-gray-800 border-b pb-2">O que você consome?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONSUMPTION_TYPES.map((item) => (
                <label
                  key={item.field}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form[item.field]
                    ? "border-primary-green bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={form[item.field]}
                    onChange={(e) => handleChange(item.field, e.target.checked)}
                    className="text-primary-green focus:ring-primary-green rounded"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Paper Preferences */}
          <section className="space-y-4">
            <h3 className="font-medium text-gray-800 border-b pb-2">Preferências de seda</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de seda
                </label>
                <select
                  value={form.favoritePaperType ?? ""}
                  onChange={(e) =>
                    handleChange("favoritePaperType", (e.target.value as PaperType) || null)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="WHITE">Branca</option>
                  <option value="BROWN">Marrom</option>
                  <option value="CELLULOSE">Celulose</option>
                  <option value="MIXED">Variado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanho preferido
                </label>
                <select
                  value={form.favoritePaperSize ?? ""}
                  onChange={(e) =>
                    handleChange("favoritePaperSize", (e.target.value as PaperSize) || null)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="MINI">Mini</option>
                  <option value="KING_SIZE_SLIM">King Size Slim</option>
                  <option value="KING_SIZE_TRADITIONAL">King Size Tradicional</option>
                  <option value="KING_SIZE_LONG">King Size Long</option>
                  <option value="MIXED">Variado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho de filtro de papel
              </label>
              <select
                value={form.paperFilterSize ?? ""}
                onChange={(e) =>
                  handleChange("paperFilterSize", (e.target.value as FilterPaperSize) || null)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="SHORT">Curto</option>
                <option value="MEDIUM">Médio</option>
                <option value="LONG">Longo</option>
                <option value="ULTRA_LONG">Ultra Longo</option>
                <option value="MIXED">Variado</option>
              </select>
            </div>
          </section>

          {/* Glass Filter */}
          <section className="space-y-4">
            <h3 className="font-medium text-gray-800 border-b pb-2">Piteira de vidro</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanho
                </label>
                <select
                  value={form.glassFilterSize ?? ""}
                  onChange={(e) =>
                    handleChange("glassFilterSize", (e.target.value as GlassFilterSize) || null)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="SHORT">Curta (2-4cm)</option>
                  <option value="MEDIUM">Média (4-6cm)</option>
                  <option value="LONG">Longa (6cm+)</option>
                  <option value="MIXED">Variado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Espessura
                </label>
                <select
                  value={form.glassFilterThickness ?? ""}
                  onChange={(e) =>
                    handleChange("glassFilterThickness", (e.target.value as GlassFilterThickness) || null)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="THIN">Fina (2-4mm)</option>
                  <option value="MEDIUM">Média (4-6mm)</option>
                  <option value="THICK">Grossa (6mm+)</option>
                  <option value="MIXED">Variado</option>
                </select>
              </div>
            </div>
          </section>

          {/* Tobacco */}
          <section className="space-y-4">
            <h3 className="font-medium text-gray-800 border-b pb-2">Tabaco</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Você usa tabaco?
              </label>
              <select
                value={form.tobaccoUsage ?? ""}
                onChange={(e) =>
                  handleChange("tobaccoUsage", (e.target.value as TobaccoUsage) || null)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="FULL_TIME">Sempre</option>
                <option value="MIX_ONLY">Só para misturar</option>
                <option value="NONE">Não uso</option>
              </select>
            </div>
          </section>

          {/* Interests */}
          <section className="space-y-4">
            <h3 className="font-medium text-gray-800 border-b pb-2">Seus interesses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {INTERESTS.map((item) => (
                <label
                  key={item.field}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form[item.field]
                    ? "border-primary-green bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={form[item.field]}
                    onChange={(e) => handleChange(item.field, e.target.checked)}
                    className="text-primary-green focus:ring-primary-green rounded"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Colors */}
          <section className="space-y-4">
            <h3 className="font-medium text-gray-800 border-b pb-2">Cores favoritas</h3>
            <div className="flex flex-wrap gap-2">
              {FAVORITE_COLORS.map((color) => {
                const isSelected = form.favoriteColors.includes(color.toLowerCase());
                return (
                  <label
                    key={color}
                    className={`px-3 py-1.5 rounded-full border-2 cursor-pointer transition-colors text-sm ${isSelected
                      ? "border-primary-green bg-green-50 text-primary-green"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleColorToggle(color, e.target.checked)}
                      className="hidden"
                    />
                    {color}
                  </label>
                );
              })}
            </div>
          </section>

          {/* Notes */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações adicionais
            </label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value || null)}
              placeholder="Algo mais que devemos saber?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent resize-none"
            />
          </section>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Preferências"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
