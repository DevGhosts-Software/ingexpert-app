import type { UserEntity } from '@ingexpert/schema';
import {
  AdminControlResponseSchema,
  type CreateUserDto,
  type CreateUserWithoutAuthDto,
  type GrantAuthDto,
  type UpdateUserDto,
} from '@ingexpert/schema';
import { supabase } from './supabase';

const functionName = process.env.NEXT_PUBLIC_SUPABASE_ADMIN_CONTROL_FUNCTION ?? 'admin-control';

type AdminControlEnvelope = {
  action: string;
  data: unknown;
};

type FunctionErrorPayload = {
  code?: string;
  error?: string;
};

const isResponse = (value: unknown): value is Response => value instanceof Response;

const parseFunctionErrorMessage = async (error: unknown): Promise<string | null> => {
  if (typeof error !== 'object' || error === null || !('context' in error)) {
    return null;
  }

  const context = (error as { context?: unknown }).context;
  if (!isResponse(context)) {
    return null;
  }

  const payload = (await context
    .clone()
    .json()
    .catch(() => null)) as FunctionErrorPayload | null;
  if (!payload?.error) {
    return null;
  }

  return payload.code ? `${payload.code}: ${payload.error}` : payload.error;
};

async function invokeAdminControl(body: Record<string, unknown>): Promise<AdminControlEnvelope> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session?.access_token) {
    throw new Error('AUTH_CONTEXT_MISSING: Tu sesión expiró. Inicia sesión de nuevo.');
  }

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (error) {
    const detailedMessage = await parseFunctionErrorMessage(error);
    throw new Error(
      (detailedMessage ?? error.message) || 'Failed to invoke admin-control function',
    );
  }

  const parsed = AdminControlResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid admin-control response payload');
  }
  return parsed.data as AdminControlEnvelope;
}

export async function listAdminUsers(): Promise<UserEntity[]> {
  const response = await invokeAdminControl({ action: 'list' });
  return response.data as UserEntity[];
}

export async function createAdminUser(input: CreateUserDto): Promise<UserEntity> {
  const response = await invokeAdminControl({ action: 'create', input });
  return response.data as UserEntity;
}

export async function createAdminUserWithoutAuth(
  input: CreateUserWithoutAuthDto,
): Promise<UserEntity> {
  const response = await invokeAdminControl({ action: 'createWithoutAuth', input });
  return response.data as UserEntity;
}

export async function grantAdminUserAuth(input: GrantAuthDto): Promise<UserEntity> {
  const response = await invokeAdminControl({ action: 'grantAuth', input });
  return response.data as UserEntity;
}

export async function revokeAdminUserAuth(id: string): Promise<UserEntity> {
  const response = await invokeAdminControl({ action: 'revokeAuth', id });
  return response.data as UserEntity;
}

export async function updateAdminUser(id: string, data: UpdateUserDto): Promise<UserEntity> {
  const response = await invokeAdminControl({ action: 'update', id, data });
  return response.data as UserEntity;
}

export async function removeAdminUser(id: string): Promise<{ success: boolean }> {
  const response = await invokeAdminControl({ action: 'remove', id });
  return response.data as { success: boolean };
}

export async function updateAdminUserPassword(
  id: string,
  password: string,
): Promise<{ success: boolean }> {
  const response = await invokeAdminControl({ action: 'updatePassword', id, password });
  return response.data as { success: boolean };
}
