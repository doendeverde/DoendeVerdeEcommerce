/**
 * Profile Header Component
 * 
 * Displays user avatar, name and member status in a hero-style header.
 * Following the UX_UI_design with purple gradient.
 */

"use client";

import { User, Calendar, Shield, Star } from "lucide-react";

interface ProfileHeaderProps {
  fullName: string;
  email: string;
  createdAt: Date;
  status: string;
  subscriptionPlan?: string | null;
}

export function ProfileHeader({
  fullName,
  email,
  createdAt,
  status,
  subscriptionPlan,
}: ProfileHeaderProps) {
  const memberSince = new Date(createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <p className="text-purple-200">{email}</p>

          <div className="flex flex-wrap gap-3 mt-2">
            {/* Member since */}
            <span className="flex items-center gap-1 text-sm text-purple-200">
              <Calendar className="w-4 h-4" />
              Membro desde {memberSince}
            </span>

            {/* Status */}
            <span className="flex items-center gap-1 text-sm">
              <Shield className="w-4 h-4" />
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${status === "ACTIVE"
                    ? "bg-green-500/20 text-green-100"
                    : "bg-red-500/20 text-red-100"
                  }`}
              >
                {status === "ACTIVE" ? "Ativo" : status}
              </span>
            </span>

            {/* Subscription */}
            {subscriptionPlan && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 text-yellow-300" />
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-100">
                  {subscriptionPlan}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
