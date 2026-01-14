"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronDown,
  User,
  ShoppingBag,
  Settings,
  LogOut,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/stores/authModal";

interface UserDropdownProps {
  className?: string;
}

/**
 * User avatar with dropdown menu
 * Shows user info, navigation links, and logout
 */
export function UserDropdown({ className }: UserDropdownProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => useAuthModalStore.getState().open("login")}
        className="px-4 py-2 text-sm font-medium text-white bg-primary-green hover:bg-primary-green-hover rounded-lg transition-colors"
      >
        Entrar
      </button>
    );
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-bg transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "Avatar"}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-primary-purple rounded-full">
            {initials}
          </div>
        )}

        {/* Name (hidden on mobile) */}
        <span className="hidden lg:block text-sm font-medium text-text-primary max-w-[120px] truncate">
          {user.name}
        </span>

        <ChevronDown
          className={cn(
            "hidden lg:block w-4 h-4 text-text-secondary transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-border py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-border">
            <p className="text-sm font-medium text-text-primary truncate">
              {user.name}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {user.email}
            </p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium text-primary-purple bg-primary-purple/10 rounded-full">
                <Shield className="w-3 h-3" />
                Administrador
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <DropdownLink href="/perfil" icon={User}>
              Meu Perfil
            </DropdownLink>
            <DropdownLink href="/minhas-compras" icon={ShoppingBag}>
              Minhas Compras
            </DropdownLink>

            {isAdmin && (
              <DropdownLink href="/admin" icon={Settings}>
                Área Administrativa
              </DropdownLink>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-border pt-2">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-error hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function DropdownLink({ href, icon: Icon, children }: DropdownLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-gray-bg transition-colors"
    >
      <Icon className="w-4 h-4 text-text-secondary" />
      {children}
    </Link>
  );
}
