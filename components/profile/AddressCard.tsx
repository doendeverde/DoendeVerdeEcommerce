/**
 * Address Card Component
 * 
 * Displays a single address with edit/delete actions.
 */

"use client";

import { MapPin, Edit2, Trash2, Star } from "lucide-react";

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

interface AddressCardProps {
  address: AddressData;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isDeleting?: boolean;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isDeleting,
}: AddressCardProps) {
  const formatZipCode = (zipCode: string) => {
    const cleaned = zipCode.replace(/\D/g, "");
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return zipCode;
  };

  return (
    <div
      className={`relative bg-white rounded-xl border-2 p-4 transition-all ${address.isDefault
          ? "border-primary-green bg-green-50/30"
          : "border-gray-200 hover:border-gray-300"
        }`}
    >
      {/* Default Badge */}
      {address.isDefault && (
        <div className="absolute -top-2 -right-2">
          <span className="flex items-center gap-1 px-2 py-1 bg-primary-green text-white text-xs font-medium rounded-full">
            <Star className="w-3 h-3" />
            Padrão
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex gap-3">
        <div className="mt-1">
          <MapPin className={`w-5 h-5 ${address.isDefault ? "text-primary-green" : "text-gray-400"}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Label */}
          {address.label && (
            <p className="font-semibold text-gray-900 mb-1">{address.label}</p>
          )}

          {/* Address */}
          <p className="text-sm text-gray-600">
            {address.street}, {address.number}
            {address.complement && ` - ${address.complement}`}
          </p>
          <p className="text-sm text-gray-600">
            {address.neighborhood} - {address.city}/{address.state}
          </p>
          <p className="text-sm text-gray-500">CEP: {formatZipCode(address.zipCode)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        {!address.isDefault && (
          <button
            onClick={onSetDefault}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-primary-green hover:bg-green-50 rounded-lg transition-colors"
          >
            <Star className="w-4 h-4" />
            Definir como padrão
          </button>
        )}

        <button
          onClick={onEdit}
          className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Editar
        </button>

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? "..." : "Excluir"}
        </button>
      </div>
    </div>
  );
}
