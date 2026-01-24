import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  back?: {
    href: string;
    label?: string;
  };
  children?: React.ReactNode;
  className?: string;
}

/**
 * Header de página administrativa
 * Título, descrição e ação principal
 */
export function AdminPageHeader({
  title,
  description,
  action,
  back,
  children,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {back && (
          <Link
            href={back.href}
            className="p-2 hover-bg rounded-lg transition-colors"
            title={back.label || "Voltar"}
          >
            <ArrowLeft className="w-5 h-5 text-muted" />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-default">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {children}
        {action && (
          action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-purple text-white text-sm font-medium rounded-lg hover:bg-primary-purple/90 transition-colors"
            >
              {action.icon || <Plus className="w-4 h-4" />}
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-purple text-white text-sm font-medium rounded-lg hover:bg-primary-purple/90 transition-colors"
            >
              {action.icon || <Plus className="w-4 h-4" />}
              {action.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}
