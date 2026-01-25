/**
 * Email Service
 * 
 * Serviço centralizado para envio de emails transacionais.
 * Usa Resend como provider de email.
 * 
 * @see https://resend.com/docs
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CONFIGURAÇÃO:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. Crie uma conta em https://resend.com
 * 2. Obtenha sua API Key
 * 3. Configure a variável de ambiente:
 *    - RESEND_API_KEY=re_xxxxxx
 *    - EMAIL_FROM=noreply@seudominio.com (ou onboarding@resend.dev para testes)
 * 4. (Opcional) Verifique seu domínio para enviar de endereços personalizados
 */

import { Resend } from "resend";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

// Lazy initialization para evitar erro durante build
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY não configurada. Configure no .env para habilitar envio de emails."
      );
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

// Email padrão do remetente
// Em dev/teste, use onboarding@resend.dev
// Em prod, use um email do seu domínio verificado
const EMAIL_FROM = process.env.EMAIL_FROM || "DoendVerde <onboarding@resend.dev>";

// Nome da aplicação para templates
const APP_NAME = "DoendeVerde";

// URL base da aplicação
function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "http://localhost:3000";
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Email Templates
// ─────────────────────────────────────────────────────────────────────────────

function getPasswordResetEmailHtml(resetUrl: string, userName?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #16a34a; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🌿 ${APP_NAME}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">
                Recuperação de Senha
              </h2>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${userName ? `Olá, <strong>${userName}</strong>!` : "Olá!"}
              </p>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta. 
                Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 16px 32px; background-color: #16a34a; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3);">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
              </p>
              
              <p style="margin: 0 0 20px; padding: 12px; background-color: #f3f4f6; border-radius: 4px; word-break: break-all;">
                <a href="${resetUrl}" style="color: #16a34a; font-size: 14px; text-decoration: none;">
                  ${resetUrl}
                </a>
              </p>
              
              <!-- Warning -->
              <div style="margin: 30px 0 0; padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>⚠️ Atenção:</strong> Este link expira em <strong>1 hora</strong>.
                  Se você não solicitou esta recuperação, ignore este email.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Este é um email automático, não responda.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} ${APP_NAME}. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getPasswordResetEmailText(resetUrl: string, userName?: string): string {
  return `
${APP_NAME} - Recuperação de Senha

${userName ? `Olá, ${userName}!` : "Olá!"}

Recebemos uma solicitação para redefinir a senha da sua conta.

Clique no link abaixo para criar uma nova senha:
${resetUrl}

⚠️ ATENÇÃO: Este link expira em 1 hora.

Se você não solicitou esta recuperação, ignore este email.

---
Este é um email automático, não responda.
© ${new Date().getFullYear()} ${APP_NAME}
  `.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Email Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envia email de recuperação de senha.
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  userName?: string
): Promise<SendEmailResult> {
  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  console.log("[Email] Sending password reset email to:", to);
  console.log("[Email] Reset URL:", resetUrl);

  // Em desenvolvimento sem API key, simula envio
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] ⚠️ RESEND_API_KEY não configurada - simulando envio");
    console.log("[Email] 📧 EMAIL SIMULADO:");
    console.log("   Para:", to);
    console.log("   Assunto: Recuperação de Senha - DoendeVerde");
    console.log("   Link:", resetUrl);
    return { success: true, messageId: "simulated" };
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject: `Recuperação de Senha - ${APP_NAME}`,
      html: getPasswordResetEmailHtml(resetUrl, userName),
      text: getPasswordResetEmailText(resetUrl, userName),
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("[Email] ✅ Email sent successfully:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao enviar email" 
    };
  }
}

/**
 * Envia email de confirmação de alteração de senha.
 */
export async function sendPasswordChangedEmail(
  to: string,
  userName?: string
): Promise<SendEmailResult> {
  console.log("[Email] Sending password changed confirmation to:", to);

  // Em desenvolvimento sem API key, simula envio
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] ⚠️ RESEND_API_KEY não configurada - simulando envio");
    return { success: true, messageId: "simulated" };
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject: `Senha Alterada - ${APP_NAME}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Senha Alterada - ${APP_NAME}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 40px;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 40px;">
    <tr>
      <td>
        <h2 style="color: #16a34a;">🔐 Senha Alterada com Sucesso</h2>
        <p style="color: #4b5563;">${userName ? `Olá, ${userName}!` : "Olá!"}</p>
        <p style="color: #4b5563;">Sua senha foi alterada com sucesso.</p>
        <p style="color: #6b7280; font-size: 14px;">
          Se você não realizou esta alteração, entre em contato imediatamente com nosso suporte.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      text: `${APP_NAME} - Senha Alterada\n\n${userName ? `Olá, ${userName}!` : "Olá!"}\n\nSua senha foi alterada com sucesso.\n\nSe você não realizou esta alteração, entre em contato imediatamente com nosso suporte.`,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("[Email] ✅ Password changed email sent:", data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao enviar email" 
    };
  }
}
