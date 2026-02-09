import { z } from 'zod';
import { UserRole } from '@rikal/database';

export const CreateUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: z.nativeEnum(UserRole).optional(),
  name: z.string().max(100).optional().nullable(),
  avatar: z.url().max(500).optional().nullable(),
  timezone: z.string().max(50).optional(),
  locale: z.string().max(10).optional(),
  preferredRetention: z.number().min(0.1).max(0.99).optional(),
  darkMode: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = CreateUserSchema.partial().omit({ id: true }).extend({
  version: z.number().int().optional(),
});
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

export const AdminUserUpdateSchema = CreateUserSchema.partial().omit({ id: true });
