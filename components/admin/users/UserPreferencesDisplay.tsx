/**
 * UserPreferencesDisplay Component
 *
 * Exibe as preferências do usuário de forma clara e organizada no admin.
 * Facilita a visualização para montagem de kits de assinatura personalizados.
 */

"use client";

import { useState } from "react";
import {
  Cigarette,
  Clock,
  Palette,
  Scroll,
  GlassWater,
  Heart,
  MessageSquare,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserPreferencesData {
  id: string;
  yearsSmoking: number | null;
  favoritePaperType: string | null;
  favoritePaperSize: string | null;
  paperFilterSize: string | null;
  glassFilterSize: string | null;
  glassFilterThickness: string | null;
  favoriteColors: string[];
  tobaccoUsage: string | null;
  consumptionFrequency: string | null;
  consumptionMoment: string[];
  consumesFlower: boolean;
  consumesSkunk: boolean;
  consumesHash: boolean;
  consumesExtracts: boolean;
  consumesOilEdibles: boolean;
  likesAccessories: boolean;
  likesCollectibles: boolean;
  likesPremiumItems: boolean;
  notes: string | null;
  updatedAt: Date;
}

interface UserPreferencesDisplayProps {
  preferences: UserPreferencesData | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Label Mappings - Mapeamentos amigáveis para os enums
// ─────────────────────────────────────────────────────────────────────────────

const CONSUMPTION_FREQUENCY_LABELS: Record<string, string> = {
  OCCASIONAL: "Até 5 enrolados por dia",
  WEEKLY: "De 5 até 10 enrolados por dia",
  DAILY: "Acima de 10 enrolados por dia",
  HEAVY: "Apenas em rolês",
};

const CONSUMPTION_MOMENT_LABELS: Record<string, string> = {
  MORNING: "Antes/depois das refeições",
  AFTERNOON: "Antes/depois do expediente",
  NIGHT: "Para dormir",
  WEEKEND: "Para atividades do dia a dia",
};

const PAPER_TYPE_LABELS: Record<string, string> = {
  WHITE: "Seda branca",
  BROWN: "Seda marrom",
  CELLULOSE: "Celulose",
  MIXED: "Um pouco de cada",
};

const PAPER_SIZE_LABELS: Record<string, string> = {
  MINI: "1 1/4 (mini size)",
  KING_SIZE_SLIM: "King Size Slim",
  KING_SIZE_TRADITIONAL: "King Size Tradicional",
  KING_SIZE_LONG: "King Size Longa",
  MIXED: "Um pouco de cada",
};

const PAPER_FILTER_SIZE_LABELS: Record<string, string> = {
  SHORT: "Curta",
  MEDIUM: "Média",
  LONG: "Longa",
  ULTRA_LONG: "Ultra longa",
  MIXED: "Um pouco de cada",
};

const GLASS_FILTER_SIZE_LABELS: Record<string, string> = {
  SHORT: "Curta (2-4cm)",
  MEDIUM: "Média (4-6cm)",
  LONG: "Longa (6cm+)",
  MIXED: "Um pouco de cada",
};

const GLASS_FILTER_THICKNESS_LABELS: Record<string, string> = {
  THIN: "Fina (2-4mm)",
  MEDIUM: "Média (4-6mm)",
  THICK: "Grossa (6mm+)",
  MIXED: "Um pouco de cada",
};

const TOBACCO_USAGE_LABELS: Record<string, string> = {
  FULL_TIME: "Uso para tudo",
  MIX_ONLY: "Só para misturas",
  NONE: "Não uso",
};

const CONSUMPTION_TYPE_LABELS: Record<string, string> = {
  consumesFlower: "Prensadinho",
  consumesSkunk: "Flor/Skunk/Colom",
  consumesHash: "Hash (dry, ice, meleca)",
  consumesExtracts: "Extratos",
  consumesOilEdibles: "Óleos ou Comestíveis",
};

const INTEREST_LABELS: Record<string, string> = {
  likesAccessories: "Colecionar itens 4e20",
  likesCollectibles: "Explorar novidades",
  likesPremiumItems: "Ganhar itens das marcas favoritas",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getLabel(value: string | null, labels: Record<string, string>): string {
  if (!value) return "Não informado";
  return labels[value] || value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function UserPreferencesDisplay({ preferences }: UserPreferencesDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!preferences) {
    return (
      <div className="bg-surface rounded-xl border border-default overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-bg/50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-3">
            <Heart className="w-6 h-6 text-primary-purple" />
            Preferências do Usuário
          </h2>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary" />
          )}
        </button>

        {isExpanded && (
          <div className="px-6 pb-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-text-secondary text-base">
                Usuário ainda não preencheu suas preferências
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Get consumption types
  const consumptionTypes = Object.entries(CONSUMPTION_TYPE_LABELS)
    .filter(([key]) => preferences[key as keyof UserPreferencesData] === true)
    .map(([, label]) => label);

  // Get interests
  const interests = Object.entries(INTEREST_LABELS)
    .filter(([key]) => preferences[key as keyof UserPreferencesData] === true)
    .map(([, label]) => label);

  // Get consumption moments
  const moments = (preferences.consumptionMoment || [])
    .map((m) => CONSUMPTION_MOMENT_LABELS[m] || m);

  // Get colors
  const colors = (preferences.favoriteColors || []).map(
    (c) => c.charAt(0).toUpperCase() + c.slice(1)
  );

  return (
    <div className="bg-surface rounded-xl border border-default overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-bg/50 transition-colors"
      >
        <h2 className="text-xl font-semibold text-text-primary flex items-center gap-3">
          <Heart className="w-6 h-6 text-primary-purple" />
          Preferências do Usuário
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Calendar className="w-4 h-4" />
            Atualizado em {formatDate(preferences.updatedAt)}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-default">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Consumo */}
            <PreferenceSection
              icon={<Cigarette className="w-5 h-5" />}
              title="Sobre o Consumo"
              color="text-green-600"
            >
              <PreferenceItem
                label="Frequência"
                value={getLabel(preferences.consumptionFrequency, CONSUMPTION_FREQUENCY_LABELS)}
                highlight
              />
              {preferences.yearsSmoking !== null && (
                <PreferenceItem
                  label="Anos fumando"
                  value={`${preferences.yearsSmoking} ano${preferences.yearsSmoking !== 1 ? "s" : ""}`}
                />
              )}
              {moments.length > 0 && (
                <PreferenceItem label="Momentos de consumo">
                  <TagList items={moments} color="bg-green-bg text-green-text" />
                </PreferenceItem>
              )}
            </PreferenceSection>

            {/* O que consome */}
            <PreferenceSection
              icon={<Clock className="w-5 h-5" />}
              title="O que Consome"
              color="text-blue-600"
            >
              {consumptionTypes.length > 0 ? (
                <TagList items={consumptionTypes} color="bg-blue-bg text-blue-text" />
              ) : (
                <span className="text-base text-text-secondary">Não informado</span>
              )}
            </PreferenceSection>

            {/* Seda */}
            <PreferenceSection
              icon={<Scroll className="w-5 h-5" />}
              title="Preferências de Seda"
              color="text-amber-600"
            >
              <PreferenceItem
                label="Tipo de seda"
                value={getLabel(preferences.favoritePaperType, PAPER_TYPE_LABELS)}
              />
              <PreferenceItem
                label="Tamanho"
                value={getLabel(preferences.favoritePaperSize, PAPER_SIZE_LABELS)}
              />
              <PreferenceItem
                label="Tamanho piteira de papel"
                value={getLabel(preferences.paperFilterSize, PAPER_FILTER_SIZE_LABELS)}
              />
            </PreferenceSection>

            {/* Piteira de Vidro */}
            <PreferenceSection
              icon={<GlassWater className="w-5 h-5" />}
              title="Piteira de Vidro"
              color="text-cyan-600"
            >
              <PreferenceItem
                label="Tamanho"
                value={getLabel(preferences.glassFilterSize, GLASS_FILTER_SIZE_LABELS)}
              />
              <PreferenceItem
                label="Espessura"
                value={getLabel(preferences.glassFilterThickness, GLASS_FILTER_THICKNESS_LABELS)}
              />
            </PreferenceSection>

            {/* Tabaco */}
            <PreferenceSection
              icon={<Cigarette className="w-5 h-5" />}
              title="Uso de Tabaco"
              color="text-orange-600"
            >
              <PreferenceItem
                label="Uso"
                value={getLabel(preferences.tobaccoUsage, TOBACCO_USAGE_LABELS)}
                highlight={preferences.tobaccoUsage === "FULL_TIME"}
              />
            </PreferenceSection>

            {/* Interesses */}
            <PreferenceSection
              icon={<Heart className="w-5 h-5" />}
              title="Interesses"
              color="text-pink-600"
            >
              {interests.length > 0 ? (
                <TagList items={interests} color="bg-pink-bg text-pink-text" />
              ) : (
                <span className="text-base text-text-secondary">Não informado</span>
              )}
            </PreferenceSection>

            {/* Cores */}
            {colors.length > 0 && (
              <PreferenceSection
                icon={<Palette className="w-5 h-5" />}
                title="Cores Favoritas"
                color="text-purple-600"
              >
                <TagList items={colors} color="bg-purple-bg text-purple-text" />
              </PreferenceSection>
            )}

            {/* Observações */}
            {preferences.notes && (
              <div className="md:col-span-2">
                <PreferenceSection
                  icon={<MessageSquare className="w-5 h-5" />}
                  title="Observações do Usuário"
                  color="text-gray-600"
                >
                  <p className="text-base text-text-primary bg-gray-bg p-4 rounded-lg italic">
                    &quot;{preferences.notes}&quot;
                  </p>
                </PreferenceSection>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface PreferenceSectionProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}

function PreferenceSection({ icon, title, color, children }: PreferenceSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className={`text-base font-semibold flex items-center gap-2 ${color}`}>
        {icon}
        {title}
      </h3>
      <div className="pl-7 space-y-3">{children}</div>
    </div>
  );
}

interface PreferenceItemProps {
  label: string;
  value?: string;
  highlight?: boolean;
  children?: React.ReactNode;
}

function PreferenceItem({ label, value, highlight, children }: PreferenceItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-text-secondary font-medium">{label}</span>
      {children || (
        <span
          className={`text-base ${highlight
            ? "text-primary-purple font-semibold"
            : value === "Não informado"
              ? "text-text-secondary italic"
              : "text-text-primary"
            }`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

interface TagListProps {
  items: string[];
  color: string;
}

function TagList({ items, color }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className={`px-3 py-1 text-sm font-medium rounded-full ${color}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
