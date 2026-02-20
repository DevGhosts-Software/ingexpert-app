import { z } from 'zod';

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});
export type LoginDto = z.infer<typeof LoginSchema>;
