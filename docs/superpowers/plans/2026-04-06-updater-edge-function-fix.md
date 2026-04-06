# Updater Edge Function Fix - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `ingexpert-updater` Supabase Edge Function to return Tauri v2-compatible JSON, reading the `latest.json` manifest from private Supabase storage and generating signed download URLs for binaries.

**Architecture:** The edge function acts as an authenticated proxy. It reads `latest.json` from Supabase Storage (using SERVICE_ROLE_KEY), extracts the public download URLs for the client's platform, generates signed URLs via `createSignedUrl`, and returns a Tauri-compatible response. No changes to the workflow, `latest.json` format, or frontend hooks are needed.

**Tech Stack:** Deno, Supabase Storage JavaScript client, Tauri Updater Plugin v2

---

## File Map

```
packages/database/supabase/functions/ingexpert-updater/index.ts   ← FIX THIS FILE
apps/frontend/src-tauri/tauri.conf.json                          ← VERIFY (endpoints/pu
```

---

## Task 1: Fix the ingexpert-updater Edge Function

**Files:**
- Modify: `packages/database/supabase/functions/ingexpert-updater/index.ts`

### Step 1: Read the current file and understand the broken structure

The current code has these issues:
- `manifest.files?.[osArch]` should be `manifest.platforms?.[osArch]` (Tauri v2 uses `platforms`)
- OS arch key mismatch: code uses `linux-x64` / `windows-x64` but Tauri sends `linux` / `windows`; the manifest uses `linux-x86_64` / `windows-x86_64`
- Wrong field names in response: returns `date` instead of `pub_date`, `path` instead of `url`, `urls` array instead of `platforms[os].url`
- `createSignedUrl` is called with a path that already includes `version/` prefix, causing double-prefix

### Step 2: Write the corrected implementation

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!authHeader) return null
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Authenticate the request
    const token = getBearerToken(req)
    if (!token) {
      return Response.json({ error: 'Authentication required' }, { status: 401, headers: corsHeaders })
    }

    const { data: userData, error: userError } = await adminClient.auth.getUser(token)
    if (userError || !userData.user?.id) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401, headers: corsHeaders })
    }

    // Determine target platform from request header
    const clientOs = req.headers.get('x-os') ?? Deno.build.os
    const isWindows = clientOs === 'windows' || clientOs === 'win'

    // Tauri v2 platform keys (match latest.json structure)
    const tauriOsKey = isWindows ? 'windows-x86_64' : 'linux-x86_64'

    // Read latest.json from storage (private bucket, service role)
    const { data: manifestData, error: manifestError } = await adminClient.storage
      .from('releases')
      .download('latest.json')

    if (manifestError || !manifestData) {
      return Response.json({ error: 'Failed to fetch release manifest' }, { status: 404, headers: corsHeaders })
    }

    const manifest = await manifestData.json()
    const version: string = manifest.version
    const pubDate: string = manifest.pub_date

    // Get platform entry from manifest
    const platformEntry = manifest.platforms?.[tauriOsKey]
    if (!platformEntry) {
      return Response.json({ error: `No assets found for platform: ${tauriOsKey}` }, { status: 404, headers: corsHeaders })
    }

    const publicUrl: string = platformEntry.url
    const signature: string = platformEntry.signature

    // Extract the path from the public URL for signed URL generation
    // URL format: https://{project}.supabase.co/storage/v1/object/public/releases/v{version}/{osArch}/{filename}
    const urlObj = new URL(publicUrl)
    const publicPath = urlObj.pathname.replace('/storage/v1/object/public/', '')

    // Generate signed URL for the binary (1 hour expiry)
    const { data: signedUrlData, error: signedError } = await adminClient.storage
      .from('releases')
      .createSignedUrl(publicPath, 3600)

    if (signedError || !signedUrlData) {
      console.error('Signed URL error:', signedError)
      return Response.json({ error: 'Failed to generate download URL' }, { status: 500, headers: corsHeaders })
    }

    // Return Tauri v2-compatible format
    const body = {
      version,
      pub_date: pubDate,
      platforms: {
        [tauriOsKey]: {
          signature,
          url: signedUrlData.signedUrl,
        },
      },
    }

    return Response.json(body, { headers: corsHeaders })
  } catch (error) {
    console.error('Updater error:', error)
    return Response.json({ error: 'Failed to process update request' }, { status: 500, headers: corsHeaders })
  }
})
```

### Step 3: Verify the implementation

- [ ] Check that `manifest.platforms?.[tauriOsKey]` matches the `latest.json` structure (`linux-x86_64` / `windows-x86_64` keys)
- [ ] Check that response uses `pub_date` not `date`
- [ ] Check that response uses `platforms[os].url` not `urls` array
- [ ] Check that `createSignedUrl` receives the correct storage path (without `/storage/v1/object/public/` prefix)
- [ ] Compare with `admin-control/index.ts` for code style consistency (already done — follows same patterns)

### Step 4: Commit

```bash
git add packages/database/supabase/functions/ingexpert-updater/index.ts
git commit -m "fix: return Tauri v2-compatible JSON from ingexpert-updater"
```

---

## Verification

After deployment, test the flow:

1. Build a release (`pnpm tauri build`)
2. Trigger the updater in dev mode — the `useUpdater` hook calls `@tauri-apps/plugin-updater`'s `check()` which:
   - Sends request to `https://{project}.supabase.co/functions/v1/ingexpert-updater` with `Authorization: Bearer {session_token}` header
   - Edge function authenticates, reads `latest.json` from storage, generates signed URL, returns Tauri JSON
   - Tauri validates signature against `pubkey` in `tauri.conf.json`, downloads binary via signed URL

3. Verify no console errors about "failed to fetch remote JSON"
4. Verify the binary is downloaded and install prompt appears

---

## Spec Coverage Check

| Requirement | Status |
|------------|--------|
| Edge function returns Tauri v2 format | ✓ Task 1 Step 2 |
| Reads `latest.json` from private storage | ✓ Task 1 Step 2 |
| Requires authenticated user | ✓ Task 1 Step 2 |
| Generates signed download URL | ✓ Task 1 Step 2 |
| No changes to workflow / frontend hooks | ✓ N/A |
