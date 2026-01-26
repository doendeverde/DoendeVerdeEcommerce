/**
 * Preferences Step Component
 * 
 * Step 1 of subscription checkout: User preferences form.
 * Collects consumption habits, paper preferences, and interests
 * to personalize subscription kits.
 */

"use client";

import { useState, useCallback } from "react";
import { Settings, ArrowRight, Loader2 } from "lucide-react";
import type {
  PreferencesFormData,
  UserPreferencesData,
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

interface PreferencesStepProps {
  initialPreferences: UserPreferencesData | null;
  hasExistingPreferences: boolean;
  onContinue: () => void;
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
  { field: "likesAccessories" as const, label: "Gosto de acessórios (dichavadores, piteiras, etc.)" },
  { field: "likesCollectibles" as const, label: "Gosto de itens colecionáveis" },
  { field: "likesPremiumItems" as const, label: "Prefiro itens premium" },
];

const FAVORITE_COLORS = ["Verde", "Preto", "Roxo", "Azul", "Vermelho", "Amarelo", "Rosa", "Branco"];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Create initial form state
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

export function PreferencesStep({
  initialPreferences,
  hasExistingPreferences,
  onContinue,
}: PreferencesStepProps) {
  // Form state
  const [form, setForm] = useState<PreferencesFormData>(() =>
    createInitialFormState(initialPreferences)
  );
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const hasInvalidYearsSmoking = form.yearsSmoking !== null && form.yearsSmoking > 100;
  const hasMinimumPreferences =
    (hasExistingPreferences || touched) && form.consumptionFrequency !== null && !hasInvalidYearsSmoking;

  // Handlers
  const handleChange = useCallback(<K extends keyof PreferencesFormData>(
    field: K,
    value: PreferencesFormData[K]
  ) => {
    setTouched(true);
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleMomentToggle = useCallback((moment: ConsumptionMoment, checked: boolean) => {
    setTouched(true);
    setForm(prev => ({
      ...prev,
      consumptionMoment: checked
        ? [...prev.consumptionMoment, moment]
        : prev.consumptionMoment.filter(m => m !== moment),
    }));
  }, []);

  const handleColorToggle = useCallback((color: string, checked: boolean) => {
    setTouched(true);
    const colorLower = color.toLowerCase();
    setForm(prev => ({
      ...prev,
      favoriteColors: checked
        ? [...prev.favoriteColors, colorLower]
        : prev.favoriteColors.filter(c => c !== colorLower),
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!hasMinimumPreferences) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!result.success) {
        // Mostrar detalhes da validação se disponíveis
        if (result.details && result.details.length > 0) {
          const errorMessages = result.details.map((d: { field: string; message: string }) =>
            `${d.field}: ${d.message}`
          ).join("; ");
          setError(`Dados inválidos: ${errorMessages}`);
        } else {
          setError(result.error || "Erro ao salvar preferências");
        }
        return;
      }

      onContinue();
    } catch {
      setError("Erro ao salvar preferências. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [form, hasMinimumPreferences, onContinue]);

  return (
    <div className="bg-surface rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-default mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary-green" />
        {hasExistingPreferences ? "Revisar suas Preferências" : "Definir Preferências"}
      </h2>

      <p className="text-muted mb-6">
        {hasExistingPreferences
          ? "Confira se suas preferências estão atualizadas. Você pode editá-las antes de continuar."
          : "Para personalizar sua experiência e kit, precisamos conhecer suas preferências."}
      </p>

      <div className="space-y-6">
        {/* Consumption Section */}
        <ConsumptionSection
          form={form}
          onChange={handleChange}
          onMomentToggle={handleMomentToggle}
        />

        {/* What You Consume Section */}
        <WhatYouConsumeSection form={form} onChange={handleChange} />

        {/* Paper Preferences Section */}
        <PaperPreferencesSection form={form} onChange={handleChange} />

        {/* Glass Filter Section */}
        <GlassFilterSection form={form} onChange={handleChange} />

        {/* Tobacco Section */}
        <TobaccoSection form={form} onChange={handleChange} />

        {/* Interests Section */}
        <InterestsSection form={form} onChange={handleChange} />

        {/* Favorite Colors */}
        <FavoriteColorsSection
          colors={form.favoriteColors}
          onToggle={handleColorToggle}
        />

        {/* Notes */}
        <NotesSection
          notes={form.notes}
          onChange={(value) => handleChange("notes", value)}
        />
      </div>

      {/* Validation Message */}
      {!hasMinimumPreferences && (
        <div className="mt-4 bg-yellow-bg border border-yellow-border rounded-lg p-3">
          <p className="text-sm text-yellow-text">
            Selecione pelo menos sua frequência de consumo para continuar.
          </p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!hasMinimumPreferences || isLoading}
        className="w-full mt-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            Continuar
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface SectionProps {
  form: PreferencesFormData;
  onChange: <K extends keyof PreferencesFormData>(field: K, value: PreferencesFormData[K]) => void;
}

function ConsumptionSection({
  form,
  onChange,
  onMomentToggle,
}: SectionProps & { onMomentToggle: (moment: ConsumptionMoment, checked: boolean) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-primary-purple border-b border-primary-purple/30 pb-2">Sobre seu consumo</h3>

      {/* Consumption Frequency */}
      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Frequência de consumo *
        </label>
        <select
          value={form.consumptionFrequency ?? ""}
          onChange={(e) =>
            onChange("consumptionFrequency", (e.target.value as ConsumptionFrequency) || null)
          }
          className="input-default"
        >
          <option value="">Selecione...</option>
          <option value="OCCASIONAL">Ocasional</option>
          <option value="WEEKLY">Semanal</option>
          <option value="DAILY">Diário</option>
          <option value="HEAVY">Frequente</option>
        </select>
      </div>

      {/* Consumption Moments */}
      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Quando você costuma consumir?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CONSUMPTION_MOMENTS.map((moment) => (
            <label
              key={moment.value}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.consumptionMoment.includes(moment.value)
                ? "border-primary-green bg-primary-green/10"
                : "border-default hover:border-gray-400 dark:hover:border-gray-500"
                }`}
            >
              <input
                type="checkbox"
                checked={form.consumptionMoment.includes(moment.value)}
                onChange={(e) => onMomentToggle(moment.value, e.target.checked)}
                className="text-primary-green focus:ring-primary-green rounded"
              />
              <span className="text-sm text-muted">{moment.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Years Smoking */}
      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Há quantos anos você fuma?
        </label>
        <input
          type="number"
          min="0"
          value={form.yearsSmoking ?? ""}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : null;
            onChange("yearsSmoking", value);
          }}
          placeholder="Ex: 5"
          className="input-default"
        />
        <p className="text-xs text-muted mt-1">Opcional - nos ajuda a personalizar sua experiência</p>
      </div>
    </div>
  );
}

function WhatYouConsumeSection({ form, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-primary-purple border-b border-primary-purple/30 pb-2">O que você consome?</h3>
      <div className="grid grid-cols-2 gap-2">
        {CONSUMPTION_TYPES.map((item) => (
          <label
            key={item.field}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form[item.field]
              ? "border-primary-green bg-primary-green/10"
              : "border-default hover:border-gray-400 dark:hover:border-gray-500"
              }`}
          >
            <input
              type="checkbox"
              checked={form[item.field]}
              onChange={(e) => onChange(item.field, e.target.checked)}
              className="text-primary-green focus:ring-primary-green rounded"
            />
            <span className="text-sm text-muted">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function PaperPreferencesSection({ form, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-primary-purple border-b border-primary-purple/30 pb-2">Preferências de seda</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Tipo de seda preferido
          </label>
          <select
            value={form.favoritePaperType ?? ""}
            onChange={(e) =>
              onChange("favoritePaperType", (e.target.value as PaperType) || null)
            }
            className="input-default"
          >
            <option value="">Selecione...</option>
            <option value="WHITE">Branca</option>
            <option value="BROWN">Marrom</option>
            <option value="CELLULOSE">Celulose</option>
            <option value="MIXED">Variado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Tamanho preferido
          </label>
          <select
            value={form.favoritePaperSize ?? ""}
            onChange={(e) =>
              onChange("favoritePaperSize", (e.target.value as PaperSize) || null)
            }
            className="input-default"
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
        <label className="block text-sm font-medium text-muted mb-2">
          Tamanho de filtro de papel
        </label>
        <select
          value={form.paperFilterSize ?? ""}
          onChange={(e) =>
            onChange("paperFilterSize", (e.target.value as FilterPaperSize) || null)
          }
          className="input-default"
        >
          <option value="">Selecione...</option>
          <option value="SHORT">Curto</option>
          <option value="MEDIUM">Médio</option>
          <option value="LONG">Longo</option>
          <option value="ULTRA_LONG">Ultra Longo</option>
          <option value="MIXED">Variado</option>
        </select>
      </div>
    </div>
  );
}

function GlassFilterSection({ form, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-primary-purple border-b border-primary-purple/30 pb-2">Piteira de vidro</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Tamanho
          </label>
          <select
            value={form.glassFilterSize ?? ""}
            onChange={(e) =>
              onChange("glassFilterSize", (e.target.value as GlassFilterSize) || null)
            }
            className="input-default"
          >
            <option value="">Selecione...</option>
            <option value="SHORT">Curta (2-4cm)</option>
            <option value="MEDIUM">Média (4-6cm)</option>
            <option value="LONG">Longa (6cm+)</option>
            <option value="MIXED">Variado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Espessura
          </label>
          <select
            value={form.glassFilterThickness ?? ""}
            onChange={(e) =>
              onChange("glassFilterThickness", (e.target.value as GlassFilterThickness) || null)
            }
            className="input-default"
          >
            <option value="">Selecione...</option>
            <option value="THIN">Fina (2-4mm)</option>
            <option value="MEDIUM">Média (4-6mm)</option>
            <option value="THICK">Grossa (6mm+)</option>
            <option value="MIXED">Variado</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function TobaccoSection({ form, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-primary-purple border-b border-primary-purple/30 pb-2">Tabaco</h3>
      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Você usa tabaco?
        </label>
        <select
          value={form.tobaccoUsage ?? ""}
          onChange={(e) =>
            onChange("tobaccoUsage", (e.target.value as TobaccoUsage) || null)
          }
          className="input-default"
        >
          <option value="">Selecione...</option>
          <option value="FULL_TIME">Sempre</option>
          <option value="MIX_ONLY">Só para misturar</option>
          <option value="NONE">Não uso</option>
        </select>
      </div>
    </div>
  );
}

function InterestsSection({ form, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-primary-purple border-b border-primary-purple/30 pb-2">Seus interesses</h3>
      <div className="grid grid-cols-1 gap-2">
        {INTERESTS.map((item) => (
          <label
            key={item.field}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form[item.field]
              ? "border-primary-green bg-primary-green/10"
              : "border-default hover:border-gray-400 dark:hover:border-gray-500"
              }`}
          >
            <input
              type="checkbox"
              checked={form[item.field]}
              onChange={(e) => onChange(item.field, e.target.checked)}
              className="text-primary-green focus:ring-primary-green rounded"
            />
            <span className="text-sm text-muted">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FavoriteColorsSection({
  colors,
  onToggle,
}: {
  colors: string[];
  onToggle: (color: string, checked: boolean) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted mb-2">
        Cores favoritas (para acessórios)
      </label>
      <div className="flex flex-wrap gap-2">
        {FAVORITE_COLORS.map((color) => {
          const isSelected = colors.includes(color.toLowerCase());
          return (
            <label
              key={color}
              className={`px-3 py-1.5 rounded-full border-2 cursor-pointer transition-colors text-sm ${isSelected
                ? "border-primary-green bg-primary-green/10 text-primary-green"
                : "border-default hover:border-gray-400 dark:hover:border-gray-500 text-muted"
                }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onToggle(color, e.target.checked)}
                className="hidden"
              />
              {color}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function NotesSection({
  notes,
  onChange,
}: {
  notes: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted mb-1">
        Observações adicionais
      </label>
      <textarea
        value={notes ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Algo mais que devemos saber sobre suas preferências?"
        rows={3}
        className="input-default resize-none"
      />
    </div>
  );
}
