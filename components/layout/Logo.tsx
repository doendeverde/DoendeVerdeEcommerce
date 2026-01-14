import Link from "next/link";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

/**
 * Doende HeadShop Logo
 * Displays icon + text (text can be hidden on mobile)
 */
export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 font-semibold text-lg text-text-primary hover:opacity-80 transition-opacity",
        className
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 bg-primary-green-light rounded-lg">
        <Leaf className="w-5 h-5 text-primary-green" />
      </div>
      {showText && (
        <span className="hidden sm:inline">Doende HeadShop</span>
      )}
    </Link>
  );
}
