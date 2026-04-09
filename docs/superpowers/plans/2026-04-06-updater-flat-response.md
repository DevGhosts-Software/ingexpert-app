# Updater Edge Function — Flat Response Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `ingexpert-updater` Edge Function to return Tauri v2-compatible flat JSON (no auth needed since Tauri can't send headers), reading `latest.json` from private Supabase Storage and generating signed download URLs.

**Architecture:** The edge function acts as an unauthenticated proxy for Tauri. It reads `latest.json` from Supabase Storage (using `SERVICE_ROLE_KEY`), detects the client platform via `User-Agent` header or hardcoded fallback, generates signed URLs via `createSignedUrl`, and returns flat Tauri-compatible JSON. No changes to workflow, `latest.json` format, or frontend hooks are needed.

**Tech Stack:** Deno, Supabase Storage JavaScript client, Tauri Updater Plugin v2

---

## File Map

```
packages/database/supabase/functions/ingexpert-updater/index.ts   ← FIX THIS FILE
```

---

## Task 1: Fix the ingexpert-updater Edge Function

**Files:**
- Modify: `packages/database/supabase/functions/ingexpert-updater/index.ts`

### Step 1: Read the current file

The current code has these issues:
1. Auth check — remove it (Tauri can't send headers)
2. `User-Agent` header detection for platform — current `x-os` header approach won't work from Tauri
3. Response is nested `{ platforms: { 'linux-x86_64': { url, signature } } }` — must be flat for Tauri dynamic server

### Step 2: Write the corrected implementation

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const SIGNED_URL_EXPIRY_SECONDS = 3600

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Detect platform from User-Agent header (Tauri sends "tauri/<version>" in User-Agent)
    const userAgent = req.headers.get('user-agent') ?? ''
    const isWindows = userAgent.includes('Windows') || !userAgent.includes('Linux')
    const tauriOsKey = isWindows ? 'windows-x86_64' : 'linux-x86_64'

    // Read latest.json from storage (private bucket, service role)
    const { data: manifestData, error: manifestError } = await adminClient.storage
      .from('releases')
      .download('latest.json')

    if (manifestError || !manifestData) {
      return Response.json({ error: 'Failed to fetch release manifest' }, { status: 404, headers: corsHeaders })
    }

    const manifest = await manifestData.json()

    if (!manifest.version || typeof manifest.version !== 'string') {
      return Response.json({ error: 'Invalid manifest: missing or invalid version' }, { status: 400, headers: corsHeaders })
    }
    if (!manifest.pub_date || typeof manifest.pub_date !== 'string') {
      return Response.json({ error: 'Invalid manifest: missing or invalid pub_date' }, { status: 400, headers: corsHeaders })
    }
    const version: string = manifest.version
    const pubDate: string = manifest.pub_date

    // Get platform entry from manifest
    const platformEntry = manifest.platforms?.[tauriOsKey]
    if (!platformEntry) {
      return Response.json({ error: `No assets found for platform: ${tauriOsKey}` }, { status: 404, headers: corsHeaders })
    }

    if (!platformEntry.url || typeof platformEntry.url !== 'string') {
      return Response.json({ error: 'Invalid manifest: missing or invalid url for platform' }, { status: 400, headers: corsHeaders })
    }
    if (!platformEntry.signature || typeof platformEntry.signature !== 'string') {
      return Response.json({ error: 'Invalid manifest: missing or invalid signature for platform' }, { status: 400, headers: corsHeaders })
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
      .createSignedUrl(publicPath, SIGNED_URL_EXPIRY_SECONDS)

    if (signedError || !signedUrlData) {
      console.error('Signed URL error:', signedError)
      return Response.json({ error: 'Failed to generate download URL' }, { status: 500, headers: corsHeaders })
    }

    // Return FLAT Tauri v2 dynamic server format (not nested platforms{})
    const body = {
      version,
      pub_date: pubDate,
      url: signedUrlData.signedUrl,
      signature,
      notes: manifest.notes ?? 'Update available',
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
- [ ] Check that response is **flat** (`url`, `signature`, `notes` at top level, NOT nested in `platforms{}`)
- [ ] Check that `createSignedUrl` receives the correct storage path (without `/storage/v1/object/public/` prefix)
- [ ] Check that auth is removed (no `getBearerToken`, no `adminClient.auth.getUser`)
- [ ] Check that `SIGNED_URL_EXPIRY_SECONDS` constant is used instead of magic number

### Step 4: Commit

```bash
git add packages/database/supabase/functions/ingexpert-updater/index.ts
git commit -m "fix: return flat Tauri v2 JSON from ingexpert-updater"
```

---

## Verification

After deployment, test the flow:

1. Build a release (`pnpm tauri build`)
2. Trigger the updater in dev mode — the `useUpdater` hook calls `@tauri-apps/plugin-updater`'s `check()` which:
   - Sends request to `https://{project}.supabase.co/functions/v1/ingexpert-updater` (no auth headers possible)
   - Edge function reads `latest.json` from storage, generates signed URL, returns flat Tauri JSON
   - Tauri validates signature against `pubkey` in `tauri.conf.json`, downloads binary via signed URL

3. Verify no console errors about "failed to fetch remote JSON"
4. Verify the binary is downloaded and install prompt appears

---

## Spec Coverage Check

| Requirement | Status |
|------------|--------|
| Edge function returns flat Tauri v2 format | ✓ Task 1 Step 2 |
| Reads `latest.json` from private storage | ✓ Task 1 Step 2 |
| No auth required (Tauri can't send headers) | ✓ Task 1 Step 2 |
| Generates signed download URL | ✓ Task 1 Step 2 |
| Uses `SIGNED_URL_EXPIRY_SECONDS` constant | ✓ Task 1 Step 2 |
| Platform detection via User-Agent fallback | ✓ Task 1 Step 2 |
| No changes to workflow / frontend hooks | ✓ N/A |
