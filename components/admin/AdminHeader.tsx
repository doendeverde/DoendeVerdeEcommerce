"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, Search, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
}

// Mapeamento de paths para breadcrumbs
const breadcrumbMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Produtos",
  "/admin/products/new": "Novo Produto",
  "/admin/orders": "Pedidos",
  "/admin/users": "Usuários",
  "/admin/categories": "Categorias",
  "/admin/settings": "Configurações",
};

/**
 * Header da área administrativa
 * Contém breadcrumbs, busca e menu do usuário
 */
export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();

  // Gera breadcrumbs baseado no pathname
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [];

    let currentPath = "";
    for (const part of parts) {
      currentPath += `/${part}`;
      const label = breadcrumbMap[currentPath] || formatBreadcrumb(part);
      crumbs.push({ label, href: currentPath });
    }

    return crumbs;
  };

  const formatBreadcrumb = (text: string) => {
    // Remove UUID patterns and format nicely
    if (text.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return "Detalhes";
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface border-b border-default">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        {/* Left: Page title and breadcrumbs */}
        <div className="flex flex-col justify-center">
          <h1 className="text-lg font-semibold text-default">
            {pageTitle}
          </h1>
          <nav className="hidden sm:flex items-center gap-1 text-xs text-muted">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center">
                {index > 0 && <span className="mx-1">/</span>}
                <span
                  className={cn(
                    index === breadcrumbs.length - 1
                      ? "text-primary-purple font-medium"
                      : "hover:text-default"
                  )}
                >
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search button (placeholder) */}
          <button
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted bg-page rounded-lg hover-bg transition-colors"
            title="Buscar"
          >
            <Search className="w-4 h-4" />
            <span>Buscar...</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-surface rounded border border-default">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg hover-bg transition-colors"
            title="Notificações"
          >
            <Bell className="w-5 h-5 text-muted" />
            {/* Badge de notificações */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3 pl-2 ml-2 border-l">
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

            {/* Info (hidden on mobile) */}
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-medium text-default">
                {user.name}
              </span>
              <span className="text-xs text-muted">
                Administrador
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg hover-bg transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4 text-muted" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
