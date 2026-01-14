import { Logo } from "./Logo";
import { Navbar } from "./Navbar";
import { CartButton } from "./CartButton";
import { UserDropdown } from "./UserDropdown";
import { MobileMenu } from "./MobileMenu";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

/**
 * Main header component
 * Fixed at top, contains logo, navigation, cart, and user menu
 */
export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-white border-b border-gray-border",
        className
      )}
    >
      <div className="container-main h-16 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu + Logo */}
        <div className="flex items-center gap-2">
          <MobileMenu />
          <Logo />
        </div>

        {/* Center: Navigation (hidden on mobile) */}
        <Navbar />

        {/* Right Section: Cart + User */}
        <div className="flex items-center gap-1">
          <CartButton itemCount={0} />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
