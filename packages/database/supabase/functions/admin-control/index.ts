import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { z } from 'npm:zod@4.1.11';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({ action: z.literal('get'), id: z.string().uuid() }),
  z.object({
    action: z.literal('create'),
    input: z.object({
      email: z.string().email(),
      role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
      name: z.string().max(100).optional().nullable(),
      avatar: z.string().url().max(500).optional().nullable(),
      password: z.string().min(8),
      workArea: z.string().max(100).optional().nullable(),
    }),
  }),
  z.object({
    action: z.literal('createWithoutAuth'),
    input: z.object({
      email: z.string().email(),
      role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
      name: z.string().max(100).optional().nullable(),
      avatar: z.string().url().max(500).optional().nullable(),
      workArea: z.string().max(100).optional().nullable(),
    }),
  }),
  z.object({
    action: z.literal('grantAuth'),
    input: z.object({
      id: z.string().uuid(),
      password: z.string().min(8),
    }),
  }),
  z.object({ action: z.literal('revokeAuth'), id: z.string().uuid() }),
  z.object({
    action: z.literal('update'),
    id: z.string().uuid(),
    data: z.object({
      name: z.string().max(100).optional().nullable(),
      avatar: z.string().url().max(500).optional().nullable(),
      workArea: z.string().max(100).optional().nullable(),
      role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
    }),
  }),
  z.object({ action: z.literal('remove'), id: z.string().uuid() }),
  z.object({
    action: z.literal('updatePassword'),
    id: z.string().uuid(),
    password: z.string().min(8),
  }),
]);

type ActionPayload = z.infer<typeof ActionSchema>;

type UserRow = {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SUPERADMIN';
  name: string | null;
  avatar: string | null;
  has_auth?: boolean | null;
  staff?: Array<{ work_area?: { name?: string | null } | null }> | null;
};

const mapUserEntity = (row: UserRow) => {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name ?? null,
    avatar: row.avatar ?? null,
    has_auth: row.has_auth === true,
    workArea: row.staff?.[0]?.work_area?.name ?? null,
  };
};

const roleHierarchy: Record<string, number> = {
  USER: 0,
  ADMIN: 1,
  SUPERADMIN: 2,
};

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

type CallerResolutionCode = 'AUTH_CONTEXT_MISSING' | 'AUTH_TOKEN_INVALID';

type CallerResolutionResult =
  | { ok: true; callerId: string; strategy: 'forwarded-header' | 'bearer-token' }
  | { ok: false; code: CallerResolutionCode; message: string };

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
};

const getForwardedCallerId = (req: Request): string | null => {
  const headerCandidates = [
    'x-supabase-auth-user',
    'x-jwt-claim-sub',
    'x-auth-user',
    'x-supabase-user-id',
  ];
  for (const headerName of headerCandidates) {
    const value = req.headers.get(headerName)?.trim();
    if (value) {
      return value;
    }
  }
  return null;
};

const resolveCallerIdentity = async (
  req: Request,
  adminClient: ReturnType<typeof createClient>,
): Promise<CallerResolutionResult> => {
  const forwardedCallerId = getForwardedCallerId(req);
  if (forwardedCallerId) {
    return { ok: true, callerId: forwardedCallerId, strategy: 'forwarded-header' };
  }

  const token = getBearerToken(req);
  if (!token) {
    return {
      ok: false,
      code: 'AUTH_CONTEXT_MISSING',
      message: 'Missing authenticated caller context',
    };
  }

  const { data: callerData, error: callerError } = await adminClient.auth.getUser(token);
  if (callerError || !callerData.user?.id) {
    return {
      ok: false,
      code: 'AUTH_TOKEN_INVALID',
      message: callerError?.message ?? 'Invalid caller token',
    };
  }

  return { ok: true, callerId: callerData.user.id, strategy: 'bearer-token' };
};

const isAuthUserNotFoundError = (error: { message?: string } | null | undefined): boolean =>
  /user not found/i.test(error?.message ?? '');

const isTargetSuperadmin = async (
  adminClient: ReturnType<typeof createClient>,
  id: string,
): Promise<boolean> => {
  const { data } = await adminClient.from('users').select('role').eq('id', id).maybeSingle();
  return data?.role === 'SUPERADMIN';
};

const mapAdminControlAuthError = (error: { message?: string } | null | undefined): string => {
  const msg = error?.message ?? '';
  if (msg.includes('SUPERADMIN_PROTECTED')) {
    return 'No se puede modificar a un SuperAdministrador.';
  }
  if (msg.includes('ROLE_NOT_ALLOWED')) {
    return 'No tienes permiso para asignar este rol.';
  }
  return msg;
};

const ensureWorkArea = async (adminClient: ReturnType<typeof createClient>, workArea: string) => {
  const { data: existing, error: existingError } = await adminClient
    .from('work_areas')
    .select('id')
    .eq('name', workArea)
    .maybeSingle();
  if (existingError) {
    throw new Error(existingError.message);
  }
  if (existing?.id) {
    return existing.id;
  }

  const { data: created, error: createError } = await adminClient
    .from('work_areas')
    .upsert({ id: crypto.randomUUID(), name: workArea }, { onConflict: 'name' })
    .select('id')
    .single();
  if (createError) {
    throw new Error(createError.message);
  }
  return created.id as string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return json(500, { error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required' });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const callerResolution = await resolveCallerIdentity(req, adminClient);
  if (!callerResolution.ok) {
    return json(401, {
      code: callerResolution.code,
      error: callerResolution.message,
    });
  }
  const callerId = callerResolution.callerId;

  const { data: callerUser, error: callerUserError } = await adminClient
    .from('users')
    .select('role')
    .eq('id', callerId)
    .single();
  if (callerUserError) {
    return json(403, { code: 'ADMIN_LOOKUP_FAILED', error: callerUserError.message });
  }
  const callerRole = callerUser?.role;
  if (!callerRole || roleHierarchy[callerRole] < 1) {
    return json(403, { code: 'ADMIN_ROLE_REQUIRED', error: 'Admin role required' });
  }

  let payload: ActionPayload;
  try {
    payload = ActionSchema.parse(await req.json());
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : 'Invalid payload' });
  }

  try {
    if (payload.action === 'list') {
      const { data, error } = await adminClient
        .from('users')
        .select('id,email,role,name,avatar,has_auth,staff(work_area:work_areas(name))')
        .order('email', { ascending: true });
      if (error) throw new Error(error.message);
      return json(200, { action: payload.action, data: (data ?? []).map(mapUserEntity) });
    }

    if (payload.action === 'get') {
      const { data, error } = await adminClient
        .from('users')
        .select('id,email,role,name,avatar,has_auth,staff(work_area:work_areas(name))')
        .eq('id', payload.id)
        .single();
      if (error) throw new Error(error.message);
      return json(200, { action: payload.action, data: mapUserEntity(data as UserRow) });
    }

    if (payload.action === 'create') {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: payload.input.email,
        password: payload.input.password,
        email_confirm: true,
        user_metadata: {
          nombre: payload.input.name ?? payload.input.email,
          rol: payload.input.role ?? 'USER',
        },
      });
      if (authError || !authData.user)
        throw new Error(authError?.message ?? 'Failed to create auth user');

      const userId = authData.user.id;
      const { error: userError } = await adminClient.from('users').upsert({
        id: userId,
        email: payload.input.email,
        role: payload.input.role ?? 'USER',
        name: payload.input.name ?? null,
        avatar: payload.input.avatar ?? null,
        has_auth: true,
      });
      if (userError) throw new Error(userError.message);

      const allowedRoles =
        callerRole === 'SUPERADMIN' ? ['USER', 'ADMIN', 'SUPERADMIN'] : ['USER', 'ADMIN'];
      if (!allowedRoles.includes(payload.input.role ?? 'USER')) {
        return json(403, { code: 'ROLE_NOT_ALLOWED', error: 'Cannot create this role' });
      }

      if (payload.input.workArea) {
        const workAreaId = await ensureWorkArea(adminClient, payload.input.workArea);
        const { error: staffError } = await adminClient
          .from('staff')
          .upsert({ id: userId, work_area_id: workAreaId }, { onConflict: 'id' });
        if (staffError) throw new Error(staffError.message);
      }

      const { data, error } = await adminClient
        .from('users')
        .select('id,email,role,name,avatar,has_auth,staff(work_area:work_areas(name))')
        .eq('id', userId)
        .single();
      if (error) throw new Error(error.message);
      return json(200, { action: payload.action, data: mapUserEntity(data as UserRow) });
    }

    if (payload.action === 'createWithoutAuth') {
      const userId = crypto.randomUUID();
      const { error: userError } = await adminClient.from('users').insert({
        id: userId,
        email: payload.input.email,
        role: payload.input.role ?? 'USER',
        name: payload.input.name ?? null,
        avatar: payload.input.avatar ?? null,
        has_auth: false,
      });
      if (userError) throw new Error(userError.message);

      const allowedRoles =
        callerRole === 'SUPERADMIN' ? ['USER', 'ADMIN', 'SUPERADMIN'] : ['USER', 'ADMIN'];
      if (!allowedRoles.includes(payload.input.role ?? 'USER')) {
        return json(403, { code: 'ROLE_NOT_ALLOWED', error: 'Cannot create this role' });
      }

      if (payload.input.workArea) {
        const workAreaId = await ensureWorkArea(adminClient, payload.input.workArea);
        const { error: staffError } = await adminClient.from('staff').insert({
          id: userId,
          work_area_id: workAreaId,
        });
        if (staffError) throw new Error(staffError.message);
      }

      const { data, error } = await adminClient
        .from('users')
        .select('id,email,role,name,avatar,has_auth,staff(work_area:work_areas(name))')
        .eq('id', userId)
        .single();
      if (error) throw new Error(error.message);
      return json(200, { action: payload.action, data: mapUserEntity(data as UserRow) });
    }

    if (payload.action === 'grantAuth') {
      const { data: userData, error: userError } = await adminClient
        .from('users')
        .select('id,email,name,role,has_auth')
        .eq('id', payload.input.id)
        .single();
      if (userError) throw new Error(userError.message);
      if (callerRole !== 'SUPERADMIN' && userData.role !== 'USER') {
        return json(403, { code: 'ROLE_NOT_ALLOWED', error: 'Cannot grant auth to this role' });
      }
      if (userData.role === 'SUPERADMIN') {
        return json(403, { code: 'SUPERADMIN_PROTECTED', error: 'Cannot modify a SuperAdmin' });
      }
      if (userData.has_auth) throw new Error('User already has auth access');

      const { error: authError } = await adminClient.auth.admin.createUser({
        id: payload.input.id,
        email: userData.email,
        password: payload.input.password,
        email_confirm: true,
        user_metadata: { nombre: userData.name ?? userData.email, rol: userData.role },
      });
      if (authError) throw new Error(authError.message);

      const { error: updateError } = await adminClient
        .from('users')
        .update({ has_auth: true })
        .eq('id', payload.input.id);
      if (updateError) throw new Error(updateError.message);

      const { data, error } = await adminClient
        .from('users')
        .select('id,email,role,name,avatar,has_auth,staff(work_area:work_areas(name))')
        .eq('id', payload.input.id)
        .single();
      if (error) throw new Error(error.message);
      return json(200, { action: payload.action, data: mapUserEntity(data as UserRow) });
    }

    if (payload.action === 'revokeAuth') {
      const { data: existingUser, error: existingUserError } = await adminClient
        .from('users')
        .select('id,has_auth,role')
        .eq('id', payload.id)
        .maybeSingle();
      if (existingUserError) throw new Error(existingUserError.message);
      if (!existingUser) throw new Error('User not found');
      if (existingUser?.role === 'SUPERADMIN') {
        return json(403, { code: 'SUPERADMIN_PROTECTED', error: 'Cannot modify a SuperAdmin' });
      }
      if (callerRole !== 'SUPERADMIN' && existingUser?.role === 'ADMIN') {
        return json(403, { code: 'ADMIN_ROLE_REQUIRED', error: 'Cannot revoke auth of an admin' });
      }

      const { error: authError } = await adminClient.auth.admin.deleteUser(payload.id);
      if (authError && !isAuthUserNotFoundError(authError)) {
        throw new Error(authError.message);
      }
      const { error: updateError } = await adminClient
        .from('users')
        .update({ has_auth: false })
        .eq('id', payload.id);
      if (updateError) throw new Error(updateError.message);
      const { data, error } = await adminClient
        .from('users')
        .select('id,email,role,name,avatar,has_auth,staff(work_area:work_areas(name))')
        .eq('id', payload.id)
        .single();
      if (error) throw new Error(error.message);
      return json(200, { action: payload.action, data: mapUserEntity(data as UserRow) });
    }

    if (payload.action === 'update') {
      const { data: targetUser } = await adminClient
        .from('users')
        .select('role')
        .eq('id', payload.id)
        .single();

      if (targetUser?.role === 'SUPERADMIN') {
        return json(403, { code: 'SUPERADMIN_PROTECTED', error: 'Cannot modify a SuperAdmin' });
      }

      if (payload.data.role !== undefined && callerRole !== 'SUPERADMIN') {
        return json(403, { code: 'ROLE_NOT_ALLOWED', error: 'Only SuperAdmin can change roles' });
      }

      const updatePatch: Record<string, unknown> = {};
      if (payload.data.name !== undefined) updatePatch.name = payload.data.name;
      if (payload.data.avatar !== undefined) updatePatch.avatar = payload.data.avatar;
      if (payload.data.role !== undefined) updatePatch.role = payload.data.role;

      if (Object.keys(updatePatch).length > 0) {
        const { error: userError } = await adminClient
          .from('users')
          .update(updatePatch)
          .eq('id', payload.id);
        if (userError) throw new Error(userError.message);
      }

      if (payload.data.workArea !== undefined) {
        if (payload.data.workArea) {
          const workAreaId = await ensureWorkArea(adminClient, payload.data.workArea);
          const { error: staffError } = await adminClient
            .from('staff')
            .upsert({ id: payload.id, work_area_id: workAreaId }, { onConflict: 'id' });
          if (staffError) throw new Error(staffError.message);
        } else {
          const { error: clearError } = await adminClient
            .from('staff')
            .update({ work_area_id: null })
            .eq('id', payload.id);
          if (clearError) throw new Error(clearError.message);
        }
      }

      if (payload.data.name !== undefined && targetUser?.role !== 'SUPERADMIN') {
        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(payload.id, {
          user_metadata: { nombre: payload.data.name ?? '' },
        });
        if (authUpdateError) throw new Error(authUpdateError.message);
      }

      const { data, error } = await adminClient
        .from('users')
        .select('id,email,role,name,avatar,has_auth,staff(work_area:work_areas(name))')
        .eq('id', payload.id)
        .single();
      if (error) throw new Error(error.message);
      return json(200, { action: payload.action, data: mapUserEntity(data as UserRow) });
    }

    if (payload.action === 'remove') {
      const { data: existing, error: existingError } = await adminClient
        .from('users')
        .select('id,avatar,has_auth,role')
        .eq('id', payload.id)
        .maybeSingle();
      if (existingError) throw new Error(existingError.message);
      if (existing?.role === 'SUPERADMIN') {
        return json(403, { code: 'SUPERADMIN_PROTECTED', error: 'Cannot delete a SuperAdmin' });
      }
      if (callerRole !== 'SUPERADMIN' && existing?.role === 'ADMIN') {
        return json(403, { code: 'ADMIN_ROLE_REQUIRED', error: 'Cannot delete an admin' });
      }

      if (existing?.has_auth) {
        const { error: authError } = await adminClient.auth.admin.deleteUser(payload.id);
        if (authError && !isAuthUserNotFoundError(authError)) {
          throw new Error(authError.message);
        }
      }

      const { error: deleteError } = await adminClient.from('users').delete().eq('id', payload.id);
      if (deleteError) throw new Error(deleteError.message);

      if (existing?.avatar) {
        const bucket = 'app-data';
        const marker = `/${bucket}/`;
        const markerIdx = existing.avatar.indexOf(marker);
        if (markerIdx !== -1) {
          const path = existing.avatar.slice(markerIdx + marker.length);
          await adminClient.storage.from(bucket).remove([path]);
        }
      }

      return json(200, { action: payload.action, data: { success: true } });
    }

    if (payload.action === 'updatePassword') {
      const { data: passwordTarget } = await adminClient
        .from('users')
        .select('role')
        .eq('id', payload.id)
        .single();

      if (passwordTarget?.role === 'SUPERADMIN') {
        return json(403, { code: 'SUPERADMIN_PROTECTED', error: 'Cannot modify a SuperAdmin' });
      }
      if (callerRole !== 'SUPERADMIN' && passwordTarget?.role === 'ADMIN') {
        return json(403, { code: 'ADMIN_ROLE_REQUIRED', error: 'Cannot reset password of an admin' });
      }

      const { error } = await adminClient.auth.admin.updateUserById(payload.id, {
        password: payload.password,
      });
      if (error) throw new Error(error.message);
      return json(200, { action: payload.action, data: { success: true } });
    }
  } catch (error) {
    return json(400, {
      error:
        error instanceof Error ? mapAdminControlAuthError(error) : 'Unexpected admin-control failure',
    });
  }
});
