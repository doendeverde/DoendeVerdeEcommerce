/**
 * Age Gate — LocalStorage Utilities
 *
 * Gerencia a persistência da verificação de idade (+18).
 *
 * Strategy:
 * - localStorage key "doende-age-verified" com valor "true"
 * - Simples e consistente com o padrão do tema (doende-theme)
 * - Client-side only — o site carrega normalmente e o modal
 *   aparece por cima com blur se a flag não existir
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Chave no localStorage */
export const AGE_GATE_STORAGE_KEY = "doende-age-verified";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se o usuário já confirmou idade.
 * Retorna true se a flag existe no localStorage.
 */
export function isAgeVerified(): boolean {
  if (typeof window === "undefined") return true; // SSR — assume verified
  try {
    return localStorage.getItem(AGE_GATE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Persiste que o usuário confirmou ser maior de 18 anos.
 */
export function setAgeVerified(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AGE_GATE_STORAGE_KEY, "true");
  } catch {
    // localStorage indisponível (modo anônimo em alguns browsers)
  }
}

/**
 * Remove a flag — útil para testes ou reset.
 */
export function removeAgeVerified(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AGE_GATE_STORAGE_KEY);
  } catch {
    // noop
  }
}
