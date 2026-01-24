/**
 * Theme Toggle Component
 * 
 * Button to switch between light, dark, and system themes.
 */

"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  /** Variante de exibição */
  variant?: "icon" | "dropdown" | "buttons";
  /** Classes adicionais */
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${className}`}>
        <div className="h-5 w-5" />
      </button>
    );
  }

  if (variant === "buttons") {
    return (
      <div className={`inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1 ${className}`}>
        <button
          onClick={() => setTheme("light")}
          className={`p-2 rounded-md transition-colors ${theme === "light"
              ? "bg-white dark:bg-gray-700 shadow-sm"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          title="Modo Claro"
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`p-2 rounded-md transition-colors ${theme === "dark"
              ? "bg-white dark:bg-gray-700 shadow-sm"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          title="Modo Escuro"
        >
          <Moon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme("system")}
          className={`p-2 rounded-md transition-colors ${theme === "system"
              ? "bg-white dark:bg-gray-700 shadow-sm"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          title="Sistema"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Default: single icon toggle
  // Use resolvedTheme which is more reliable after hydration
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors ${className}`}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );
}
