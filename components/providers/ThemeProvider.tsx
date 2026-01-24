/**
 * Theme Provider
 * 
 * Provides dark/light mode support using next-themes.
 * Persists user preference in localStorage.
 */

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="doende-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
