import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Age Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Idade mínima para cadastro */
export const MINIMUM_AGE = 18;

/**
 * Calcula a idade a partir de uma data de nascimento.
 * Sempre calculada dinamicamente para evitar valores stale em servidores long-running.
 */
export function calculateAge(birthDateString: string): number {
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Verifica se a pessoa é maior de idade (18+).
 */
export function isAdult(birthDateString: string): boolean {
  return calculateAge(birthDateString) >= MINIMUM_AGE;
}

/**
 * Retorna a data máxima de nascimento permitida (18 anos atrás).
 * Útil para definir o atributo `max` de inputs de data.
 */
export function getMaxBirthDate(): string {
  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - MINIMUM_AGE,
    today.getMonth(),
    today.getDate()
  );
  return maxDate.toISOString().split('T')[0];
}

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Nome completo é obrigatório')
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome muito longo')
      .trim(),
    email: z
      .string()
      .min(1, 'Email é obrigatório')
      .email('Email inválido')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, 'Senha deve ter no mínimo 8 caracteres')
      .max(100, 'Senha muito longa')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Senha deve conter letra maiúscula, minúscula e número'
      ),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
    birthDate: z
      .string()
      .min(1, 'Data de nascimento é obrigatória')
      .refine(
        (date) => !isNaN(new Date(date).getTime()),
        'Data de nascimento inválida'
      )
      .refine(
        (date) => isAdult(date),
        'Você deve ter pelo menos 18 anos para se cadastrar. Menores de idade não podem criar conta.'
      ),
    whatsapp: z
      .string()
      .min(1, 'WhatsApp é obrigatório')
      .refine(
        (val) => /^\+?[1-9]\d{10,14}$/.test(val),
        'WhatsApp inválido (formato: +5511999999999)'
      ),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, 'Você deve aceitar os termos'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
