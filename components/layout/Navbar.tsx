"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/produtos", label: "Produtos" },
  { href: "/assinaturas", label: "Assinaturas" },
] as const;

interface NavbarProps {
  className?: string;
}

/**
 * Main navigation links
 * Highlights active route
 */
export function Navbar({ className }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("hidden md:flex items-center gap-1", className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              isActive
                ? "text-primary-green bg-primary-green-light"
                : "text-text-secondary hover:text-text-primary hover:bg-gray-bg"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export { navItems };
