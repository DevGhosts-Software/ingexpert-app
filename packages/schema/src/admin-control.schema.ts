import { z } from 'zod';
import {
  CreateUserSchema,
  CreateUserWithoutAuthSchema,
  GrantAuthSchema,
  UpdateUserSchema,
  UserEntitySchema,
} from './user.schema';

export const AdminControlActionSchema = z.enum([
  'list',
  'get',
  'create',
  'createWithoutAuth',
  'grantAuth',
  'revokeAuth',
  'update',
  'remove',
  'updatePassword',
]);
export type AdminControlAction = z.infer<typeof AdminControlActionSchema>;

const AdminControlPayloadSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({ action: z.literal('get'), id: z.uuid() }),
  z.object({ action: z.literal('create'), input: CreateUserSchema }),
  z.object({ action: z.literal('createWithoutAuth'), input: CreateUserWithoutAuthSchema }),
  z.object({ action: z.literal('grantAuth'), input: GrantAuthSchema }),
  z.object({ action: z.literal('revokeAuth'), id: z.uuid() }),
  z.object({
    action: z.literal('update'),
    id: z.uuid(),
    data: UpdateUserSchema,
  }),
  z.object({ action: z.literal('remove'), id: z.uuid() }),
  z.object({
    action: z.literal('updatePassword'),
    id: z.uuid(),
    password: z.string().min(8),
  }),
]);

export const AdminControlRequestSchema = z.object({
  action: AdminControlActionSchema,
  payload: AdminControlPayloadSchema,
});
export type AdminControlRequest = z.infer<typeof AdminControlRequestSchema>;

export const AdminControlResponseSchema = z.object({
  action: AdminControlActionSchema,
  data: z.union([z.array(UserEntitySchema), UserEntitySchema, z.object({ success: z.boolean() })]),
});
export type AdminControlResponse = z.infer<typeof AdminControlResponseSchema>;
