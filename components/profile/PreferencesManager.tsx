/**
 * Preferences Manager Component
 * 
 * Container for managing user preferences.
 * Uses PreferencesDisplay and PreferencesFormModal.
 */

"use client";

import { useState, useCallback } from "react";
import { Settings } from "lucide-react";
import { PreferencesDisplay } from "./PreferencesDisplay";
import { PreferencesFormModal } from "./PreferencesFormModal";
import type { UserPreferencesData } from "@/types/subscription-checkout";

interface PreferencesManagerProps {
  initialPreferences: UserPreferencesData | null;
}

export function PreferencesManager({ initialPreferences }: PreferencesManagerProps) {
  const [preferences, setPreferences] = useState<UserPreferencesData | null>(initialPreferences);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSave = useCallback((savedPreferences: UserPreferencesData) => {
    setPreferences(savedPreferences);
  }, []);

  return (
    <div className="bg-card-bg rounded-xl shadow-sm border border-gray-border">
      <div className="px-6 py-4 border-b border-gray-border">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary-green" />
          Minhas Preferências
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Suas preferências nos ajudam a personalizar kits e recomendações
        </p>
      </div>

      <div className="p-6">
        <PreferencesDisplay
          preferences={preferences}
          onEdit={handleEdit}
        />
      </div>

      <PreferencesFormModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialPreferences={preferences}
      />
    </div>
  );
}
