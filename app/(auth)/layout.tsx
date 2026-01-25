import { PropsWithChildren } from "react";

/**
 * Auth Layout — Authentication Pages Shell
 * 
 * Used for authentication pages:
 * - Login
 * - Register
 * - Password recovery
 * 
 * Layout Structure:
 * - Full-screen centered container
 * - Card with consistent padding
 * - Gradient background
 * 
 * Spacing System:
 * - Card padding: 32px
 * - Max width: 448px (md)
 */
export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="card w-full max-w-md p-6 sm:p-8 shadow-lg">
        {children}
      </div>
    </div>
  );
}
