import { z } from 'zod';
import { UserRole } from '@ingexpert/database';

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
