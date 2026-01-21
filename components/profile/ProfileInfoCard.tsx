/**
 * Profile Info Card Component
 * 
 * Displays user personal information in a card format.
 */

"use client";

import { User, Mail, Phone, Cake, Edit2 } from "lucide-react";

interface ProfileInfoCardProps {
  fullName: string;
  email: string;
  whatsapp: string | null;
  birthDate: Date | null;
  document: string | null;
  onEdit?: () => void;
}

export function ProfileInfoCard({
  fullName,
  email,
  whatsapp,
  birthDate,
  document,
  onEdit,
}: ProfileInfoCardProps) {
  const formatBirthDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatWhatsapp = (phone: string | null) => {
    if (!phone) return null;
    // Format: (XX) XXXXX-XXXX
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatDocument = (doc: string | null) => {
    if (!doc) return null;
    const cleaned = doc.replace(/\D/g, "");
    if (cleaned.length === 11) {
      // CPF
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    }
    return doc;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-green" />
          Informações Pessoais
        </h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-sm text-primary-green hover:text-green-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Name */}
        <InfoRow
          icon={<User className="w-4 h-4 text-gray-400" />}
          label="Nome Completo"
          value={fullName}
        />

        {/* Email */}
        <InfoRow
          icon={<Mail className="w-4 h-4 text-gray-400" />}
          label="E-mail"
          value={email}
        />

        {/* WhatsApp */}
        <InfoRow
          icon={<Phone className="w-4 h-4 text-gray-400" />}
          label="WhatsApp"
          value={formatWhatsapp(whatsapp)}
          placeholder="Não informado"
        />

        {/* Birth Date */}
        <InfoRow
          icon={<Cake className="w-4 h-4 text-gray-400" />}
          label="Data de Nascimento"
          value={formatBirthDate(birthDate)}
          placeholder="Não informada"
        />

        {/* Document */}
        {document && (
          <InfoRow
            icon={<User className="w-4 h-4 text-gray-400" />}
            label="CPF"
            value={formatDocument(document)}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component
// ─────────────────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  placeholder?: string;
}

function InfoRow({ icon, label, value, placeholder = "-" }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`font-medium ${value ? "text-gray-900" : "text-gray-400"}`}>
          {value || placeholder}
        </p>
      </div>
    </div>
  );
}
