import { z } from 'zod';

// Age validation helper (18+)
const today = new Date();
const eighteenYearsAgo = new Date(
  today.getFullYear() - 18,
  today.getMonth(),
  today.getDate()
);

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
      .refine((date) => {
        const birthDate = new Date(date);
        return birthDate <= eighteenYearsAgo;
      }, 'Você deve ter 18 anos ou mais'),
    whatsapp: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+?[1-9]\d{10,14}$/.test(val),
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
