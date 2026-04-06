import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const GITHUB_REPO = 'DevGhosts-Software/ingexpert-app'
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = Deno.env.get('GITHUB_TOKEN')

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'IngExpert-Updater/1.0',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(GITHUB_API_URL, { headers })

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`)
    }

    const release = await response.json()

    // Determine target platform from request header or default to current Deno runtime
    const clientOs = req.headers.get('x-os') ?? Deno.build.os
    const isWindows = clientOs === 'windows' || clientOs === 'win'

    // Find the appropriate asset based on platform
    let targetAsset = release.assets?.find((asset: any) => {
      if (isWindows) {
        return asset.name.endsWith('.msi') || asset.name.endsWith('.exe')
      }
      return asset.name.endsWith('.AppImage') || asset.name.endsWith('.deb')
    })

    // Fallback: just find any asset
    if (!targetAsset) {
      targetAsset = release.assets?.find((asset: any) =>
        asset.name.endsWith('.AppImage') ||
        asset.name.endsWith('.msi') ||
        asset.name.endsWith('.exe') ||
        asset.name.endsWith('.deb')
      )
    }

    if (!targetAsset) {
      return Response.json(
        { error: 'No compatible asset found in latest release' },
        { status: 404, headers: corsHeaders }
      )
    }

    const version = release.tag_name?.startsWith('v')
      ? release.tag_name.slice(1)
      : release.tag_name

    const body = {
      version,
      date: release.published_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      path: targetAsset.name,
      urls: [targetAsset.browser_download_url],
    }

    return Response.json(body, { headers: corsHeaders })
  } catch (error) {
    console.error('Updater error:', error)
    return Response.json(
      { error: 'Failed to fetch release info' },
      { status: 500, headers: corsHeaders }
    )
  }
})
