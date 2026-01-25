/**
 * Forgot Password API
 * 
 * POST /api/auth/forgot-password
 * 
 * Solicita recuperação de senha enviando email com link de reset.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SEGURANÇA:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * - Não revela se email existe ou não (sempre retorna sucesso)
 * - Token expira em 1 hora
 * - Tokens anteriores são deletados ao gerar novo
 * - Rate limiting recomendado (futuro)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// Token expira em 1 hora
const TOKEN_EXPIRATION_HOURS = 1;

// Identifier prefix para distinguir de outros tokens
const PASSWORD_RESET_PREFIX = "password-reset:";

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schema
// ─────────────────────────────────────────────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .toLowerCase()
    .trim(),
});

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    console.log("[ForgotPassword] ════════════════════════════════════════");
    console.log("[ForgotPassword] Processing forgot password request...");

    // Parse body
    const body = await request.json();
    
    // Validate
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || "Dados inválidos",
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    console.log("[ForgotPassword] Email:", email);

    // Busca usuário pelo email
    // IMPORTANTE: Mesmo que não exista, retornamos sucesso para não revelar
    // se o email está cadastrado ou não (proteção contra enumeração)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        passwordHash: true,
      },
    });

    // Se usuário não existe OU não tem senha (OAuth only), simula sucesso
    if (!user || !user.passwordHash) {
      console.log("[ForgotPassword] User not found or OAuth-only account");
      // Simula delay para evitar timing attacks
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({
        success: true,
        message: "Se o email estiver cadastrado, você receberá um link de recuperação.",
      });
    }

    console.log("[ForgotPassword] User found:", user.id);

    // Gera token seguro
    const token = crypto.randomUUID();
    const identifier = `${PASSWORD_RESET_PREFIX}${email}`;
    const expires = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

    console.log("[ForgotPassword] Generating token, expires:", expires);

    // Deleta tokens anteriores do mesmo usuário
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    // Cria novo token
    await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    });

    console.log("[ForgotPassword] Token saved to database");

    // Envia email
    const emailResult = await sendPasswordResetEmail(
      user.email,
      token,
      user.fullName
    );

    if (!emailResult.success) {
      console.error("[ForgotPassword] Failed to send email:", emailResult.error);
      // Mesmo com erro de email, não revelamos ao usuário
      // Log interno para monitoramento
    } else {
      console.log("[ForgotPassword] ✅ Email sent successfully");
    }

    // Sempre retorna sucesso para não revelar existência do email
    return NextResponse.json({
      success: true,
      message: "Se o email estiver cadastrado, você receberá um link de recuperação.",
    });
  } catch (error) {
    console.error("[ForgotPassword] ❌ Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao processar solicitação. Tente novamente.",
      },
      { status: 500 }
    );
  }
}
