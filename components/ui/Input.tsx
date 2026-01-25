/**
 * Input Component
 *
 * Componente de input unificado para toda a aplicação.
 * Usa tokens de tema e garante consistência visual.
 *
 * @example
 * // Basic input
 * <Input label="Email" placeholder="seu@email.com" />
 *
 * // With error
 * <Input label="Senha" type="password" error="Senha muito curta" />
 *
 * // With icon
 * <Input label="Buscar" leftIcon={<Search />} />
 *
 * // Textarea
 * <TextArea label="Descrição" rows={4} />
 */

import { cn } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Hint text below input */
  hint?: string;
  /** Icon on the left side */
  leftIcon?: ReactNode;
  /** Icon/element on the right side */
  rightIcon?: ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Full width */
  fullWidth?: boolean;
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Hint text below input */
  hint?: string;
  /** Full width */
  fullWidth?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const labelStyles = "block text-sm font-medium text-text-primary mb-1.5";

const baseInputStyles = cn(
  // Layout
  "w-full",
  // Colors
  "bg-card-bg text-text-primary",
  "border border-gray-border",
  "placeholder:text-gray-muted",
  // Shape
  "rounded-lg",
  // Transitions
  "transition-colors duration-200",
  // Focus state
  "focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 focus:outline-none",
  // Disabled state
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-bg"
);

const errorInputStyles = cn(
  "border-error",
  "focus:border-error focus:ring-error/20"
);

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-4 py-3 text-base",
};

const hintStyles = "mt-1.5 text-xs text-text-secondary";
const errorStyles = "mt-1.5 text-xs text-error";

// ─────────────────────────────────────────────────────────────────────────────
// Input Component
// ─────────────────────────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      size = "md",
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const hasError = !!error;
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    return (
      <div className={cn(fullWidth ? "w-full" : "inline-block", className)}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={labelStyles}>
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}

        {/* Input wrapper (for icons) */}
        <div className="relative">
          {/* Left icon */}
          {hasLeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-muted pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseInputStyles,
              sizeStyles[size],
              hasError && errorInputStyles,
              hasLeftIcon && "pl-10",
              hasRightIcon && "pr-10"
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />

          {/* Right icon */}
          {hasRightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p id={`${inputId}-error`} className={errorStyles} role="alert">
            {error}
          </p>
        )}

        {/* Hint text */}
        {hint && !hasError && (
          <p id={`${inputId}-hint`} className={hintStyles}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// ─────────────────────────────────────────────────────────────────────────────
// TextArea Component
// ─────────────────────────────────────────────────────────────────────────────

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      hint,
      fullWidth = true,
      className,
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const hasError = !!error;

    return (
      <div className={cn(fullWidth ? "w-full" : "inline-block", className)}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={labelStyles}>
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}

        {/* TextArea */}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            baseInputStyles,
            "px-4 py-2.5 text-sm resize-none",
            hasError && errorInputStyles
          )}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />

        {/* Error message */}
        {hasError && (
          <p id={`${inputId}-error`} className={errorStyles} role="alert">
            {error}
          </p>
        )}

        {/* Hint text */}
        {hint && !hasError && (
          <p id={`${inputId}-hint`} className={hintStyles}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";

// ─────────────────────────────────────────────────────────────────────────────
// Select Component
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Hint text below select */
  hint?: string;
  /** Select options */
  children: ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Full width */
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      size = "md",
      fullWidth = true,
      className,
      id,
      children,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const hasError = !!error;

    return (
      <div className={cn(fullWidth ? "w-full" : "inline-block", className)}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={labelStyles}>
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}

        {/* Select */}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            baseInputStyles,
            sizeStyles[size],
            hasError && errorInputStyles,
            "appearance-none cursor-pointer",
            "bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2224%22%20height%3d%2224%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%239CA3AF%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')]",
            "bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
          )}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        >
          {children}
        </select>

        {/* Error message */}
        {hasError && (
          <p id={`${inputId}-error`} className={errorStyles} role="alert">
            {error}
          </p>
        )}

        {/* Hint text */}
        {hint && !hasError && (
          <p id={`${inputId}-hint`} className={hintStyles}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
