/**
 * Address Step Component
 * 
 * Step 2 of subscription checkout: Address selection/creation.
 * Allows users to select an existing address or create a new one.
 */

"use client";

import { useState, useCallback } from "react";
import { MapPin, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { Address } from "@prisma/client";
import type { AddressFormData } from "@/types/subscription-checkout";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AddressStepProps {
  addresses: Address[];
  selectedAddressId: string | null;
  onAddressSelect: (id: string) => void;
  onAddressCreate: (address: Address) => void;
  onBack: () => void;
  onContinue: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial Form State
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_ADDRESS_FORM: AddressFormData = {
  label: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AddressStep({
  addresses,
  selectedAddressId,
  onAddressSelect,
  onAddressCreate,
  onBack,
  onContinue,
}: AddressStepProps) {
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [form, setForm] = useState<AddressFormData>(INITIAL_ADDRESS_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = selectedAddressId !== null;

  // Handlers
  const handleFormChange = useCallback((field: keyof AddressFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCepBlur = useCallback(async () => {
    const cep = form.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;

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
    }
  }, [form.zipCode]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao salvar endereço");
        return;
      }

      // Notify parent and reset form
      onAddressCreate(result.data);
      onAddressSelect(result.data.id);
      setShowForm(false);
      setForm(INITIAL_ADDRESS_FORM);
    } catch {
      setError("Erro ao salvar endereço. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [form, onAddressCreate, onAddressSelect]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary-green" />
        Endereço de entrega
      </h2>

      {/* Address List */}
      {addresses.length > 0 && !showForm && (
        <AddressList
          addresses={addresses}
          selectedId={selectedAddressId}
          onSelect={onAddressSelect}
          onShowForm={() => setShowForm(true)}
        />
      )}

      {/* Address Form */}
      {(showForm || addresses.length === 0) && (
        <AddressForm
          form={form}
          onChange={handleFormChange}
          onCepBlur={handleCepBlur}
          onSubmit={handleSubmit}
          onCancel={addresses.length > 0 ? () => setShowForm(false) : undefined}
          isLoading={isLoading}
          error={error}
        />
      )}

      {/* Navigation */}
      {!showForm && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="flex-1 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface AddressListProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onShowForm: () => void;
}

function AddressList({ addresses, selectedId, onSelect, onShowForm }: AddressListProps) {
  return (
    <div className="space-y-3 mb-4">
      {addresses.map((address) => (
        <label
          key={address.id}
          className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedId === address.id
              ? "border-primary-green bg-green-50"
              : "border-gray-200 hover:border-gray-300"
            }`}
        >
          <input
            type="radio"
            name="address"
            value={address.id}
            checked={selectedId === address.id}
            onChange={() => onSelect(address.id)}
            className="mt-1 text-primary-green focus:ring-primary-green"
          />
          <div className="flex-1">
            {address.label && (
              <span className="text-sm font-medium text-gray-900">{address.label}</span>
            )}
            <p className="text-sm text-gray-600">
              {address.street}, {address.number}
              {address.complement && ` - ${address.complement}`}
            </p>
            <p className="text-sm text-gray-500">
              {address.neighborhood} - {address.city}/{address.state}
            </p>
            <p className="text-sm text-gray-500">CEP: {address.zipCode}</p>
          </div>
          {address.isDefault && (
            <span className="text-xs bg-primary-green/10 text-primary-green px-2 py-1 rounded-full">
              Padrão
            </span>
          )}
        </label>
      ))}
      <button
        onClick={onShowForm}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-green hover:text-primary-green transition-colors"
      >
        + Adicionar novo endereço
      </button>
    </div>
  );
}

interface AddressFormProps {
  form: AddressFormData;
  onChange: (field: keyof AddressFormData, value: string) => void;
  onCepBlur: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  isLoading: boolean;
  error: string | null;
}

function AddressForm({
  form,
  onChange,
  onCepBlur,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: AddressFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para endereços salvos
        </button>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Apelido (opcional)
        </label>
        <input
          type="text"
          value={form.label}
          onChange={(e) => onChange("label", e.target.value)}
          placeholder="Ex: Casa, Trabalho"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CEP *
          </label>
          <input
            type="text"
            value={form.zipCode}
            onChange={(e) => onChange("zipCode", e.target.value.replace(/\D/g, "").slice(0, 8))}
            onBlur={onCepBlur}
            placeholder="00000-000"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado *
          </label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => onChange("state", e.target.value.toUpperCase().slice(0, 2))}
            placeholder="UF"
            required
            maxLength={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cidade *
        </label>
        <input
          type="text"
          value={form.city}
          onChange={(e) => onChange("city", e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bairro *
        </label>
        <input
          type="text"
          value={form.neighborhood}
          onChange={(e) => onChange("neighborhood", e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rua *
          </label>
          <input
            type="text"
            value={form.street}
            onChange={(e) => onChange("street", e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número *
          </label>
          <input
            type="text"
            value={form.number}
            onChange={(e) => onChange("number", e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Complemento
        </label>
        <input
          type="text"
          value={form.complement}
          onChange={(e) => onChange("complement", e.target.value)}
          placeholder="Apto, Bloco, etc."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar endereço"
        )}
      </button>
    </form>
  );
}
