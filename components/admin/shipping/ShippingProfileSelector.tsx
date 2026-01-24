/**
 * Shipping Profile Selector Component
 *
 * Dropdown to select a shipping profile for products or subscription plans.
 */

"use client";

import { useEffect, useState } from "react";
import { Package, AlertCircle, Loader2 } from "lucide-react";
import type { ShippingProfile } from "@/types/shipping";

interface ShippingProfileSelectorProps {
  value?: string | null;
  onChange: (profileId: string | null) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export function ShippingProfileSelector({
  value,
  onChange,
  required = false,
  disabled = false,
  error,
}: ShippingProfileSelectorProps) {
  const [profiles, setProfiles] = useState<ShippingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/admin/shipping-profiles");
      const data = await response.json();

      if (data.success) {
        // Filter only active profiles
        setProfiles(data.data.filter((p: ShippingProfile) => p.isActive));
      } else {
        setFetchError(data.error || "Erro ao carregar perfis");
      }
    } catch {
      setFetchError("Erro ao carregar perfis de frete");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProfile = profiles.find((p) => p.id === value);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando perfis...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle className="w-4 h-4" />
        {fetchError}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-primary-green appearance-none bg-surface ${error ? "border-red-500" : "border-default"
            } ${disabled ? "bg-gray-bg cursor-not-allowed" : ""}`}
        >
          <option value="">
            {required ? "Selecione um perfil de frete" : "Sem frete definido"}
          </option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name} ({profile.weightKg}kg - {profile.widthCm}×
              {profile.heightCm}×{profile.lengthCm}cm)
            </option>
          ))}
        </select>
      </div>

      {/* Selected profile details */}
      {selectedProfile && (
        <div className="flex items-center gap-4 text-xs text-text-muted bg-gray-bg rounded-lg px-3 py-2">
          <span>
            <strong>Peso:</strong> {selectedProfile.weightKg}kg
          </span>
          <span>
            <strong>Dimensões:</strong> {selectedProfile.widthCm}×
            {selectedProfile.heightCm}×{selectedProfile.lengthCm}cm
          </span>
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* No profiles warning */}
      {profiles.length === 0 && (
        <p className="text-xs text-amber-600">
          Nenhum perfil de frete ativo.{" "}
          <a href="/admin/shipping" className="underline">
            Criar perfil
          </a>
        </p>
      )}
    </div>
  );
}
