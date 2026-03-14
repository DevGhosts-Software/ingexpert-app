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
  workArea: z.string().max(100).optional().nullable(),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

/** Create a user record without a Supabase auth account (no login access). */
export const CreateUserWithoutAuthSchema = CreateUserSchema.omit({ password: true });
export type CreateUserWithoutAuthDto = z.infer<typeof CreateUserWithoutAuthSchema>;

/** Grant Supabase auth access to a user that was created without it. */
export const GrantAuthSchema = z.object({
  id: z.string().uuid(),
  password: z.string().min(8),
});
export type GrantAuthDto = z.infer<typeof GrantAuthSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  password: z.string().max(100).optional().nullable(),
  avatar: z.string().url().max(500).optional().nullable(),
  workArea: z.string().max(100).optional().nullable(),
  role: z.nativeEnum(UserRole).optional(),
});
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

// ─── Entities (Prisma-derived — changes to the DB schema surface here) ────────

/**
 * Wire representation of a User returned by the API.
 * Extends the Prisma `User` model with `workArea` flattened from the Staff→WorkArea relation.
 * `has_auth` reflects whether the user has a Supabase auth account.
 */
export type UserEntity = User & { workArea: string | null };

/** Global unfiltered user statistics (for summary cards). */
export type UserStats = {
  total: number;
  admins: number;
  active: number; // users with a work area assigned
  inactive: number; // users without a work area
};

// ─── Output schemas ───────────────────────────────────────────────────────────

export const UserEntitySchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  role: z.nativeEnum(UserRole),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  has_auth: z.boolean(),
  workArea: z.string().nullable(),
});

/** Schema for the current authenticated user (workArea not populated by UsersService). */
export const CurrentUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  role: z.nativeEnum(UserRole),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  has_auth: z.boolean(),
});

export const UserStatsSchema = z.object({
  total: z.number(),
  admins: z.number(),
  active: z.number(),
  inactive: z.number(),
});

export const UserNameSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string(),
});
