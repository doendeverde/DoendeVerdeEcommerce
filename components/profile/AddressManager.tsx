/**
 * Address Manager Component
 * 
 * Manages user addresses with CRUD operations.
 * Uses AddressCard and AddressFormModal components.
 */

"use client";

import { useState, useCallback } from "react";
import { MapPin, Plus, Loader2 } from "lucide-react";
import { AddressCard } from "./AddressCard";
import { AddressFormModal } from "./AddressFormModal";

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

interface AddressManagerProps {
  initialAddresses: AddressData[];
}

export function AddressManager({ initialAddresses }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<AddressData[]>(initialAddresses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpenNew = useCallback(() => {
    setEditingAddress(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((address: AddressData) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingAddress(null);
  }, []);

  const handleSave = useCallback((savedAddress: AddressData) => {
    setAddresses(prev => {
      const existingIndex = prev.findIndex(a => a.id === savedAddress.id);

      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = savedAddress;

        // If new default, update others
        if (savedAddress.isDefault) {
          return updated.map(a =>
            a.id === savedAddress.id ? a : { ...a, isDefault: false }
          );
        }
        return updated;
      } else {
        // Add new
        if (savedAddress.isDefault) {
          return [savedAddress, ...prev.map(a => ({ ...a, isDefault: false }))];
        }
        return [savedAddress, ...prev];
      }
    });
    setError(null);
  }, []);

  const handleDelete = useCallback(async (addressId: string) => {
    if (addresses.length <= 1) {
      setError("Você deve manter pelo menos um endereço");
      return;
    }

    setDeletingId(addressId);
    setError(null);

    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao excluir endereço");
        return;
      }

      setAddresses(prev => {
        const filtered = prev.filter(a => a.id !== addressId);
        // If deleted was default, make first one default
        const deletedWasDefault = prev.find(a => a.id === addressId)?.isDefault;
        if (deletedWasDefault && filtered.length > 0) {
          filtered[0] = { ...filtered[0], isDefault: true };
        }
        return filtered;
      });
    } catch {
      setError("Erro ao excluir endereço. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  }, [addresses.length]);

  const handleSetDefault = useCallback(async (addressId: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao definir endereço padrão");
        return;
      }

      setAddresses(prev =>
        prev.map(a => ({
          ...a,
          isDefault: a.id === addressId,
        }))
      );
      setError(null);
    } catch {
      setError("Erro ao definir endereço padrão. Tente novamente.");
    }
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-green" />
          Meus Endereços
          <span className="text-sm font-normal text-gray-500">
            ({addresses.length})
          </span>
        </h2>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-primary-green hover:bg-green-600 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">
              Você ainda não tem endereços cadastrados.
            </p>
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-primary-green border border-primary-green rounded-lg hover:bg-green-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar primeiro endereço
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => handleEdit(address)}
                onDelete={() => handleDelete(address.id)}
                onSetDefault={() => handleSetDefault(address.id)}
                isDeleting={deletingId === address.id}
              />
            ))}
          </div>
        )}
      </div>

      <AddressFormModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSave={handleSave}
        editingAddress={editingAddress}
      />
    </div>
  );
}
