/**
 * Address Form Modal Component
 * 
 * Modal for creating/editing addresses.
 * Uses CEP lookup via ViaCEP API.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Loader2, MapPin } from "lucide-react";
import type { AddressFormData } from "@/types/subscription-checkout";

interface AddressData {
  id: string;
  label: string | null;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressData) => void;
  editingAddress?: AddressData | null;
}

const INITIAL_FORM: AddressFormData = {
  label: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
};

export function AddressFormModal({
  isOpen,
  onClose,
  onSave,
  editingAddress,
}: AddressFormModalProps) {
  const [form, setForm] = useState<AddressFormData>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editingAddress;

  // Reset form when modal opens/closes or editingAddress changes
  useEffect(() => {
    if (isOpen) {
      if (editingAddress) {
        setForm({
          label: editingAddress.label || "",
          street: editingAddress.street,
          number: editingAddress.number,
          complement: editingAddress.complement || "",
          neighborhood: editingAddress.neighborhood,
          city: editingAddress.city,
          state: editingAddress.state,
          zipCode: editingAddress.zipCode,
        });
      } else {
        setForm(INITIAL_FORM);
      }
      setError(null);
    }
  }, [isOpen, editingAddress]);

  const handleChange = useCallback((field: keyof AddressFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCepBlur = useCallback(async () => {
    const cep = form.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;

    setIsCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {
      // Ignore CEP lookup errors
    } finally {
      setIsCepLoading(false);
    }
  }, [form.zipCode]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/user/addresses/${editingAddress.id}`
        : "/api/user/addresses";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao salvar endereço");
        return;
      }

      onSave(result.data);
      onClose();
    } catch {
      setError("Erro ao salvar endereço. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [form, isEditing, editingAddress, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card-bg rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card-bg px-6 py-4 border-b border-gray-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-green" />
            {isEditing ? "Editar Endereço" : "Novo Endereço"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover-bg rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Apelido (opcional)
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => handleChange("label", e.target.value)}
              placeholder="Ex: Casa, Trabalho"
              className="input-default"
            />
          </div>

          {/* CEP + State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                CEP *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value.replace(/\D/g, "").slice(0, 8))}
                  onBlur={handleCepBlur}
                  placeholder="00000000"
                  required
                  className="input-default"
                />
                {isCepLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Estado *
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value.toUpperCase().slice(0, 2))}
                placeholder="UF"
                required
                maxLength={2}
                className="input-default"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Cidade *
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              required
              className="input-default"
            />
          </div>

          {/* Neighborhood */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Bairro *
            </label>
            <input
              type="text"
              value={form.neighborhood}
              onChange={(e) => handleChange("neighborhood", e.target.value)}
              required
              className="input-default"
            />
          </div>

          {/* Street + Number */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Rua *
              </label>
              <input
                type="text"
                value={form.street}
                onChange={(e) => handleChange("street", e.target.value)}
                required
                className="input-default"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Número *
              </label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => handleChange("number", e.target.value)}
                required
                className="input-default"
              />
            </div>
          </div>

          {/* Complement */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Complemento
            </label>
            <input
              type="text"
              value={form.complement}
              onChange={(e) => handleChange("complement", e.target.value)}
              placeholder="Apto, Bloco, etc."
              className="input-default"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-text bg-error-bg p-3 rounded-lg">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-border text-text-secondary rounded-lg font-medium hover:bg-hover-bg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? "Salvar Alterações" : "Adicionar Endereço"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
