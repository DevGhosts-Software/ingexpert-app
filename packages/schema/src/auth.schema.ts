import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const RegisterFormSchema = RegisterSchema.extend({
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormDto = z.infer<typeof RegisterFormSchema>;

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type LoginDto = z.infer<typeof LoginSchema>;
