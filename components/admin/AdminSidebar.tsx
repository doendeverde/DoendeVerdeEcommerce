"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Menu,
  X,
  ChevronLeft,
  Tag,
  CreditCard,
  UserCheck,
  Leaf,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produtos", icon: Package },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/categories", label: "Categorias", icon: Tag },
  { href: "/admin/subscriptions", label: "Planos", icon: CreditCard },
  { href: "/admin/user-subscriptions", label: "Assinaturas", icon: UserCheck },
  { href: "/admin/shipping", label: "Frete", icon: Truck },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

/**
 * Sidebar administrativa com navegação
 * Mobile: drawer que abre/fecha
 * Desktop: fixa à esquerda
 */
export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 bg-white rounded-lg shadow-md border border-gray-border"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5 text-text-primary" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-border",
          "transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-border">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 bg-primary-green rounded-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-primary">
                Doende
              </span>
              <span className="text-xs text-text-secondary">Admin</span>
            </div>
          </Link>

          {/* Close button (mobile) */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-bg transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  "text-sm font-medium",
                  active
                    ? "bg-primary-purple/10 text-primary-purple"
                    : "text-text-secondary hover:bg-gray-bg hover:text-text-primary"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "text-primary-purple")} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary-purple text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Back to store link */}
        <div className="p-4 border-t border-gray-border">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar à loja</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
