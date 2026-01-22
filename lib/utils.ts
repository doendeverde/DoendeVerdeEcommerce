import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx
 * Handles conditional classes and resolves Tailwind conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Brazilian currency (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Format a date to Brazilian format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Format a date with time to Brazilian format
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Round a number to 2 decimal places for monetary values.
 * Prevents floating point precision issues like 29.9 + 28.62 = 58.519999999999996
 * 
 * @example
 * roundMoney(29.9 + 28.62) // returns 58.52
 * roundMoney(100 * 0.15) // returns 15.00
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Sum multiple monetary values with proper rounding.
 * Use this instead of simple addition to avoid precision issues.
 * 
 * @example
 * sumMoney(29.9, 28.62) // returns 58.52
 * sumMoney(100, -15, 10.50) // returns 95.50
 */
export function sumMoney(...values: number[]): number {
  const sum = values.reduce((acc, val) => acc + val, 0);
  return roundMoney(sum);
}
