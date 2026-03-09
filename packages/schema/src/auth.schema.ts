import { z } from 'zod';

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});
export type LoginDto = z.infer<typeof LoginSchema>;

// ─── Output schemas ───────────────────────────────────────────────────────────

export const AuthSessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number().optional(),
  user: z
    .object({
      id: z.string().uuid(),
      email: z.string().optional(),
    })
    .nullable(),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;
