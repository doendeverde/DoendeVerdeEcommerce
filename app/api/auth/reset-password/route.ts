/**
 * Reset Password API
 * 
 * POST /api/auth/reset-password
 * 
 * Redefine a senha do usuário usando token de recuperação.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SEGURANÇA:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * - Valida expiração do token
 * - Token é deletado após uso (single use)
 * - Senha é hasheada com bcrypt
 * - Envia email de confirmação de alteração
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { sendPasswordChangedEmail } from "@/lib/email";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// Identifier prefix para distinguir de outros tokens
const PASSWORD_RESET_PREFIX = "password-reset:";

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schema
// ─────────────────────────────────────────────────────────────────────────────

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z
    .string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(100, "Senha muito longa")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Senha deve conter letra maiúscula, minúscula e número"
    ),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

// ─────────────────────────────────────────────────────────────────────────────
// GET Handler - Validate Token
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token não fornecido", valid: false },
        { status: 400 }
      );
    }

    // Busca token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: "Token inválido ou já utilizado", valid: false },
        { status: 404 }
      );
    }

    // Verifica expiração
    if (verificationToken.expires < new Date()) {
      // Deleta token expirado
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { success: false, error: "Token expirado. Solicite uma nova recuperação.", valid: false },
        { status: 410 }
      );
    }

    // Verifica se é token de password reset
    if (!verificationToken.identifier.startsWith(PASSWORD_RESET_PREFIX)) {
      return NextResponse.json(
        { success: false, error: "Token inválido", valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      expiresAt: verificationToken.expires,
    });
  } catch (error) {
    console.error("[ResetPassword] GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao validar token", valid: false },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler - Reset Password
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    console.log("[ResetPassword] ════════════════════════════════════════");
    console.log("[ResetPassword] Processing password reset...");

    // Parse body
    const body = await request.json();
    
    // Validate
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        {
          success: false,
          error: errors[0]?.message || "Dados inválidos",
          details: errors,
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Busca e valida token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      console.log("[ResetPassword] Token not found");
      return NextResponse.json(
        { success: false, error: "Token inválido ou já utilizado" },
        { status: 404 }
      );
    }

    // Verifica expiração
    if (verificationToken.expires < new Date()) {
      console.log("[ResetPassword] Token expired");
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.json(
        { success: false, error: "Token expirado. Solicite uma nova recuperação." },
        { status: 410 }
      );
    }

    // Verifica se é token de password reset
    if (!verificationToken.identifier.startsWith(PASSWORD_RESET_PREFIX)) {
      console.log("[ResetPassword] Invalid token type");
      return NextResponse.json(
        { success: false, error: "Token inválido" },
        { status: 400 }
      );
    }

    // Extrai email do identifier
    const email = verificationToken.identifier.replace(PASSWORD_RESET_PREFIX, "");
    console.log("[ResetPassword] Email from token:", email);

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      console.log("[ResetPassword] User not found");
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log("[ResetPassword] Updating password for user:", user.id);

    // Hash nova senha
    const passwordHash = await hashPassword(password);

    // Atualiza senha em transação
    await prisma.$transaction([
      // Atualiza senha do usuário
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      // Deleta token usado
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    console.log("[ResetPassword] ✅ Password updated successfully");

    // Envia email de confirmação (fire and forget)
    sendPasswordChangedEmail(user.email, user.fullName).catch((err) => {
      console.error("[ResetPassword] Failed to send confirmation email:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso! Você já pode fazer login.",
    });
  } catch (error) {
    console.error("[ResetPassword] ❌ Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao redefinir senha. Tente novamente." },
      { status: 500 }
    );
  }
}
