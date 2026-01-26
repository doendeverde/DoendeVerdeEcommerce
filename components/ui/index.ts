/**
 * UI Components Index
 *
 * Central export for all base UI components.
 * These components use design tokens and provide consistent styling.
 *
 * @example
 * import { Button, Input, Card, Badge } from "@/components/ui";
 */

// Button
export {
  Button,
  IconButton,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type IconButtonProps,
} from "./Button";

// Input
export {
  Input,
  TextArea,
  Select,
  type InputProps,
  type TextAreaProps,
  type SelectProps,
} from "./Input";

// Badge
export {
  Badge,
  StatusBadge,
  OrderStatusBadge,
  SubscriptionStatusBadge,
  type BadgeProps,
  type BadgeVariant,
  type BadgeSize,
  type StatusBadgeProps,
  type StatusType,
  type OrderStatusBadgeProps,
  type OrderStatus,
  type SubscriptionStatusBadgeProps,
  type SubscriptionStatus,
} from "./Badge";

// Card
export {
  Card,
  CardHeader,
  CardFooter,
  StatCard,
  type CardProps,
  type CardVariant,
  type CardPadding,
  type CardHeaderProps,
  type CardFooterProps,
  type StatCardProps,
} from "./Card";

// Modal
export { Modal } from "./Modal";

// Theme
export { ThemeToggle } from "./ThemeToggle";

// Price Display
export { 
  PriceDisplay, 
  SubscriptionDiscountBadge,
  CompactPriceDisplay,
  SavingsSummary,
} from "./PriceDisplay";

// Cloudinary
export { CloudinaryUpload } from "./CloudinaryUpload";
export { ProductImage } from "./ProductImage";
