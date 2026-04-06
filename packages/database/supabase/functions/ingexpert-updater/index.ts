import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!authHeader) {
    return null
  }
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

    // Verify JWT from Authorization header - reject unauthenticated users
    const token = getBearerToken(req)
    if (!token) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { data: userData, error: userError } = await adminClient.auth.getUser(token)
    if (userError || !userData.user?.id) {
      return Response.json(
        { error: 'Invalid or expired token' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Determine target platform from request header or default to current Deno runtime
    const clientOs = req.headers.get('x-os') ?? Deno.build.os
    const isWindows = clientOs === 'windows' || clientOs === 'win'

    // Read latest.json from storage
    const { data: manifestData, error: manifestError } = await adminClient.storage
      .from('releases')
      .download('latest.json')

    if (manifestError || !manifestData) {
      return Response.json(
        { error: 'Failed to fetch release manifest' },
        { status: 404, headers: corsHeaders }
      )
    }

    const manifest = await manifestData.json()
    const version = manifest.version
    const date = manifest.date

    // Determine OS architecture key
    const osArch = isWindows ? 'windows-x64' : 'linux-x64'
    const platformFiles = manifest.files?.[osArch]

    if (!platformFiles) {
      return Response.json(
        { error: `No assets found for platform: ${osArch}` },
        { status: 404, headers: corsHeaders }
      )
    }

    // Pick the preferred file for this platform (prefer AppImage/deb for linux, msi for windows)
    let targetFileName: string | null = null
    if (isWindows) {
      targetFileName = platformFiles.msi || platformFiles.nsis || Object.values(platformFiles)[0] as string
    } else {
      targetFileName = platformFiles.appimage || platformFiles.deb || Object.values(platformFiles)[0] as string
    }

    if (!targetFileName) {
      return Response.json(
        { error: 'No compatible asset found in release' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Generate signed URL for the binary (valid for 1 hour)
    const path = `${version}/${osArch}/${targetFileName}`
    const { data: signedUrlData, error: signedError } = await adminClient.storage
      .from('releases')
      .createSignedUrl(path, 3600) // 1 hour expiry

    if (signedError || !signedUrlData) {
      console.error('Signed URL error:', signedError)
      return Response.json(
        { error: 'Failed to generate download URL' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Return Tauri-compatible format
    const body = {
      version,
      date,
      path: targetFileName,
      urls: [signedUrlData.signedUrl],
    }

    return Response.json(body, { headers: corsHeaders })
  } catch (error) {
    console.error('Updater error:', error)
    return Response.json(
      { error: 'Failed to process update request' },
      { status: 500, headers: corsHeaders }
    )
  }
})
