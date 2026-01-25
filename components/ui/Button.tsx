/**
 * Button Component
 *
 * Componente de botão unificado para toda a aplicação.
 * Usa tokens de tema e garante consistência visual.
 *
 * @example
 * // Primary button
 * <Button variant="primary">Confirmar</Button>
 *
 * // Secondary button with icon
 * <Button variant="secondary" leftIcon={<ArrowLeft />}>Voltar</Button>
 *
 * // Loading state
 * <Button isLoading>Processando...</Button>
 *
 * // Full width
 * <Button fullWidth>Finalizar Compra</Button>
 */

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "success";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Shows loading spinner and disables button */
  isLoading?: boolean;
  /** Icon to show on the left side */
  leftIcon?: ReactNode;
  /** Icon to show on the right side */
  rightIcon?: ReactNode;
  /** Makes button take full width of container */
  fullWidth?: boolean;
  /** Additional class names */
  className?: string;
  /** Button content */
  children: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const baseStyles = cn(
  // Base
  "inline-flex items-center justify-center gap-2",
  "font-medium rounded-lg",
  "transition-colors duration-200",
  // Focus ring (accessibility)
  "focus:outline-none focus:ring-2 focus:ring-offset-2",
  // Disabled state
  "disabled:opacity-50 disabled:cursor-not-allowed"
);

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-primary-green text-white",
    "hover:bg-primary-green-hover",
    "focus:ring-primary-green/50"
  ),
  secondary: cn(
    "bg-gray-bg text-text-primary",
    "hover:bg-hover-bg",
    "focus:ring-gray-muted/50",
    "border border-gray-border"
  ),
  ghost: cn(
    "bg-transparent text-text-primary",
    "hover:bg-hover-bg",
    "focus:ring-gray-muted/50"
  ),
  outline: cn(
    "bg-transparent text-primary-green",
    "border-2 border-primary-green",
    "hover:bg-primary-green/10",
    "focus:ring-primary-green/50"
  ),
  danger: cn(
    "bg-error text-white",
    "hover:bg-error/90",
    "focus:ring-error/50"
  ),
  success: cn(
    "bg-success text-white",
    "hover:bg-success/90",
    "focus:ring-success/50"
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}

        {/* Left icon (hidden when loading) */}
        {!isLoading && leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* Button text */}
        <span>{children}</span>

        {/* Right icon */}
        {rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

// ─────────────────────────────────────────────────────────────────────────────
// Icon Button Variant
// ─────────────────────────────────────────────────────────────────────────────

export interface IconButtonProps
  extends Omit<ButtonProps, "children" | "leftIcon" | "rightIcon"> {
  /** The icon to display */
  icon: ReactNode;
  /** Accessible label for screen readers */
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = "md", className, ...props }, ref) => {
    const iconSizeStyles: Record<ButtonSize, string> = {
      sm: "p-1.5",
      md: "p-2",
      lg: "p-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          "rounded-lg",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[props.variant || "ghost"],
          iconSizeStyles[size],
          className
        )}
        {...props}
      >
        {props.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          icon
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
