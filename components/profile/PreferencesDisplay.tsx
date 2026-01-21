/**
 * Preferences Display Component
 * 
 * Shows user preferences in a readable format with summary.
 */

"use client";

import {
  Leaf,
  Cigarette,
  Clock,
  Palette,
  Star,
  Package,
  Edit2
} from "lucide-react";
import type { UserPreferencesData } from "@/types/subscription-checkout";

interface PreferencesDisplayProps {
  preferences: UserPreferencesData | null;
  onEdit: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Label Mappings
// ─────────────────────────────────────────────────────────────────────────────

const FREQUENCY_LABELS: Record<string, string> = {
  OCCASIONAL: "Ocasional",
  WEEKLY: "Semanal",
  DAILY: "Diário",
  HEAVY: "Frequente",
};

const PAPER_TYPE_LABELS: Record<string, string> = {
  WHITE: "Branca",
  BROWN: "Marrom",
  CELLULOSE: "Celulose",
  MIXED: "Variado",
};

const PAPER_SIZE_LABELS: Record<string, string> = {
  MINI: "Mini",
  KING_SIZE_SLIM: "King Size Slim",
  KING_SIZE_TRADITIONAL: "King Size Tradicional",
  KING_SIZE_LONG: "King Size Long",
  MIXED: "Variado",
};

const TOBACCO_LABELS: Record<string, string> = {
  FULL_TIME: "Sempre",
  MIX_ONLY: "Só para misturar",
  NONE: "Não uso",
};

const MOMENT_LABELS: Record<string, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  NIGHT: "Noite",
  WEEKEND: "Final de semana",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PreferencesDisplay({ preferences, onEdit }: PreferencesDisplayProps) {
  if (!preferences) {
    return (
      <EmptyState onEdit={onEdit} />
    );
  }

  const consumptionTypes = getConsumptionTypes(preferences);
  const interests = getInterests(preferences);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800">Suas preferências</h3>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-sm text-primary-green hover:text-green-700 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Editar
        </button>
      </div>

      {/* Consumption */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Clock className="w-4 h-4 text-primary-green" />
          Consumo
        </div>
        <div className="pl-6 space-y-2">
          {preferences.consumptionFrequency && (
            <InfoItem
              label="Frequência"
              value={FREQUENCY_LABELS[preferences.consumptionFrequency]}
            />
          )}
          {preferences.yearsSmoking !== null && preferences.yearsSmoking > 0 && (
            <InfoItem
              label="Anos fumando"
              value={`${preferences.yearsSmoking} anos`}
            />
          )}
          {preferences.consumptionMoment.length > 0 && (
            <InfoItem
              label="Momentos preferidos"
              value={preferences.consumptionMoment.map(m => MOMENT_LABELS[m]).join(", ")}
            />
          )}
        </div>
      </div>

      {/* What they consume */}
      {consumptionTypes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Leaf className="w-4 h-4 text-primary-green" />
            O que consome
          </div>
          <div className="pl-6 flex flex-wrap gap-2">
            {consumptionTypes.map((type) => (
              <span
                key={type}
                className="px-3 py-1 bg-green-50 text-primary-green text-sm rounded-full"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Paper preferences */}
      {(preferences.favoritePaperType || preferences.favoritePaperSize) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Package className="w-4 h-4 text-primary-green" />
            Seda
          </div>
          <div className="pl-6 space-y-2">
            {preferences.favoritePaperType && (
              <InfoItem
                label="Tipo"
                value={PAPER_TYPE_LABELS[preferences.favoritePaperType]}
              />
            )}
            {preferences.favoritePaperSize && (
              <InfoItem
                label="Tamanho"
                value={PAPER_SIZE_LABELS[preferences.favoritePaperSize]}
              />
            )}
          </div>
        </div>
      )}

      {/* Tobacco */}
      {preferences.tobaccoUsage && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Cigarette className="w-4 h-4 text-primary-green" />
            Tabaco
          </div>
          <div className="pl-6">
            <InfoItem
              label="Uso"
              value={TOBACCO_LABELS[preferences.tobaccoUsage]}
            />
          </div>
        </div>
      )}

      {/* Favorite colors */}
      {preferences.favoriteColors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Palette className="w-4 h-4 text-primary-green" />
            Cores favoritas
          </div>
          <div className="pl-6 flex flex-wrap gap-2">
            {preferences.favoriteColors.map((color) => (
              <span
                key={color}
                className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full capitalize"
              >
                {color}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Star className="w-4 h-4 text-primary-green" />
            Interesses
          </div>
          <div className="pl-6 flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="px-3 py-1 bg-yellow-50 text-yellow-700 text-sm rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {preferences.notes && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Observações:</p>
          <p className="text-sm text-gray-700 italic">"{preferences.notes}"</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getConsumptionTypes(preferences: UserPreferencesData): string[] {
  const types: string[] = [];
  if (preferences.consumesFlower) types.push("Flor");
  if (preferences.consumesSkunk) types.push("Skunk");
  if (preferences.consumesHash) types.push("Hash");
  if (preferences.consumesExtracts) types.push("Extratos");
  if (preferences.consumesOilEdibles) types.push("Óleos/Comestíveis");
  return types;
}

function getInterests(preferences: UserPreferencesData): string[] {
  const interests: string[] = [];
  if (preferences.likesAccessories) interests.push("Acessórios");
  if (preferences.likesCollectibles) interests.push("Colecionáveis");
  if (preferences.likesPremiumItems) interests.push("Itens Premium");
  return interests;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function EmptyState({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="text-center py-6">
      <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 mb-4">
        Você ainda não definiu suas preferências.
      </p>
      <p className="text-sm text-gray-400 mb-4">
        Suas preferências nos ajudam a personalizar kits e recomendações para você.
      </p>
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-2 px-4 py-2 text-primary-green border border-primary-green rounded-lg hover:bg-green-50 transition-colors"
      >
        <Edit2 className="w-4 h-4" />
        Definir preferências
      </button>
    </div>
  );
}
