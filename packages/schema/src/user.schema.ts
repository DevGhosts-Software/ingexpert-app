import { z } from 'zod';
import { type User, UserRole } from '@ingexpert/database';

export { UserRole } from '@ingexpert/database';

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const CreateUserSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole).optional(),
  name: z.string().max(100).optional().nullable(),
  avatar: z.string().url().max(500).optional().nullable(),
  password: z.string().min(8),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema =z.object({
  name: z.string().max(100).optional().nullable(),
  password: z.string().max(100).optional().nullable(),
  avatar: z.string().url().max(500).optional().nullable(),
});
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

// ─── Entities (Prisma-derived — changes to the DB schema surface here) ────────

/**
 * Wire representation of a User returned by the API.
 * Extends the Prisma `User` model with `workArea` flattened from the Staff relation.
 */
export type UserEntity = User & { workArea: string | null };
