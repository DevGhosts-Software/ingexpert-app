# admin-control

Single Supabase Edge Function that replaces runtime `adminUsers.*` API ownership.

## Required secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy

```bash
supabase functions deploy admin-control --no-verify-jwt=false
```

## Invoke from frontend

Use Supabase JS:

```ts
supabase.functions.invoke('admin-control', { body: { action: 'list' } });
```

The function expects a valid authenticated bearer token and enforces admin role checks against `public.users`.
