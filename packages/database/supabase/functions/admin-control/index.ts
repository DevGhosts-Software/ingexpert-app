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
      role: z.enum(['USER', 'ADMIN']).optional(),
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
      role: z.enum(['USER', 'ADMIN']).optional(),
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
      role: z.enum(['USER', 'ADMIN']).optional(),
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
  role: 'ADMIN' | 'USER';
  name: string | null;
  avatar: string | null;
  has_auth?: boolean | null;
  hasAuth?: boolean | null;
  staff?: Array<{ work_area?: { name?: string | null } | null }> | null;
};

const mapUserEntity = (row: UserRow) => {
  const hasAuthValue = typeof row.hasAuth === 'boolean' ? row.hasAuth : row.has_auth;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name ?? null,
    avatar: row.avatar ?? null,
    hasAuth: hasAuthValue === true,
    workArea: row.staff?.[0]?.work_area?.name ?? null,
  };
};

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const decodeJwtSubject = (token: string): string | null => {
  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(segments[1]));
    return typeof payload?.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
};

const getForwardedCallerId = (req: Request): string | null => {
  const headerCandidates = ['x-supabase-auth-user', 'x-jwt-claim-sub', 'x-auth-user'];
  for (const headerName of headerCandidates) {
    const value = req.headers.get(headerName)?.trim();
    if (value) {
      return value;
    }
  }
  return null;
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
    .insert({ name: workArea })
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

  // Supabase Edge may provide authenticated caller context via forwarded headers even when
  // the raw Authorization header is not surfaced to function code.
  const forwardedCallerId = getForwardedCallerId(req);
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let callerErrorMessage: string | undefined;
  let callerId = forwardedCallerId;

  if (!callerId && token) {
    const { data: callerData, error: callerError } = await adminClient.auth.getUser(token);
    callerErrorMessage = callerError?.message;
    callerId = callerData.user?.id ?? decodeJwtSubject(token);
  }

  if (!callerId) {
    return json(401, {
      error: callerErrorMessage ?? 'Missing authenticated caller context',
    });
  }

  const { data: callerUser, error: callerUserError } = await adminClient
    .from('users')
    .select('role')
    .eq('id', callerId)
    .single();
  if (callerUserError) {
    return json(403, { error: callerUserError.message });
  }
  if (callerUser?.role !== 'ADMIN') {
    return json(403, { error: 'Admin role required' });
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
      const { error: authError } = await adminClient.auth.admin.deleteUser(payload.id);
      if (authError) throw new Error(authError.message);
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

      if (payload.data.name !== undefined) {
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
        .select('id,avatar,has_auth')
        .eq('id', payload.id)
        .maybeSingle();
      if (existingError) throw new Error(existingError.message);

      if (existing?.has_auth) {
        const { error: authError } = await adminClient.auth.admin.deleteUser(payload.id);
        if (authError) throw new Error(authError.message);
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

    const { error } = await adminClient.auth.admin.updateUserById(payload.id, {
      password: payload.password,
    });
    if (error) throw new Error(error.message);
    return json(200, { action: payload.action, data: { success: true } });
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Unexpected admin-control failure',
    });
  }
});
