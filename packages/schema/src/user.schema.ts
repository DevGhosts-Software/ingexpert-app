import { z } from 'zod';
import { type User, UserRole } from '@ingexpert/database';

export { UserRole } from '@ingexpert/database';

// ─── DTOs (Zod-validated tRPC inputs) ────────────────────────────────────────

export const CreateUserSchema = z.object({
  id: z.uuid(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole).optional(),
  name: z.string().max(100).optional().nullable(),
  avatar: z.string().url().max(500).optional().nullable(),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = CreateUserSchema.partial().omit({ id: true });
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

export const AdminUserUpdateSchema = CreateUserSchema.partial().omit({ id: true });

// ─── Entities (Prisma-derived — changes to the DB schema surface here) ────────

/**
 * Wire representation of a User returned by the API.
 * Derived from the Prisma `User` model (scalar fields only — no relations).
 */
export type UserEntity = User;
