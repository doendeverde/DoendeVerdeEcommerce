/**
 * API Auth Utilities
 * 
 * Helper functions for API route authentication and authorization.
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

export type AuthResult = {
  success: true;
  session: Session;
  userId: string;
} | {
  success: false;
  response: NextResponse;
};

/**
 * Verify user is authenticated and not blocked
 * Returns session if valid, or error response if not
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  
  if (!session?.user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      ),
    };
  }

  // Check if user is blocked
  if (session.user.status === "BLOCKED") {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Conta bloqueada. Entre em contato com o suporte." },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    session,
    userId: session.user.id,
  };
}

/**
 * Verify user is authenticated, not blocked, AND is admin
 */
export async function requireAdmin(): Promise<AuthResult> {
  const authResult = await requireAuth();
  
  if (!authResult.success) {
    return authResult;
  }

  if (authResult.session?.user.role !== "ADMIN") {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Re-check user status in database (for sensitive operations)
 * Use this for critical operations like payments
 */
export async function verifyUserNotBlocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });

  return user?.status !== "BLOCKED";
}
