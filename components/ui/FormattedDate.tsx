/**
 * FormattedDate Component
 * 
 * Client-side component for formatting dates in the user's local timezone.
 * Use this component when displaying dates from Server Components to ensure
 * the date is converted to the user's local timezone in the browser.
 */

"use client";

interface FormattedDateProps {
  date: Date | string | null;
  format?: "date" | "datetime" | "long" | "short" | "relative";
  className?: string;
  fallback?: string;
}

export function FormattedDate({
  date,
  format = "date",
  className,
  fallback = "-",
}: FormattedDateProps) {
  if (!date) return <span className={className}>{fallback}</span>;

  const d = typeof date === "string" ? new Date(date) : date;

  let formatted: string;

  switch (format) {
    case "datetime":
      formatted = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      break;
    case "long":
      formatted = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      break;
    case "short":
      formatted = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      break;
    case "relative":
      formatted = getRelativeTime(d);
      break;
    case "date":
    default:
      formatted = d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      break;
  }

  return <span className={className}>{formatted}</span>;
}

/**
 * Get relative time string (e.g., "2 dias atrás")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "agora";
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays} dias atrás`;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Hook for formatting dates (for use in other client components)
 */
export function useFormatDate() {
  return {
    formatDate: (date: Date | string | null): string => {
      if (!date) return "-";
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },
    formatDateTime: (date: Date | string | null): string => {
      if (!date) return "-";
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    formatLong: (date: Date | string | null): string => {
      if (!date) return "-";
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    },
  };
}
