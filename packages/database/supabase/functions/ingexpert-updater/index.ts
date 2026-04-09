import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const SIGNED_URL_EXPIRY_SECONDS = 3600;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, user-agent',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Parse explicitly provided Tauri variables from the URL
    const url = new URL(req.url);
    const reqTarget = url.searchParams.get('target') || 'windows';
    const reqArch = url.searchParams.get('arch') || 'x86_64';
    const reqVersion = url.searchParams.get('version');

    // Map to your JSON keys
    let tauriOsKey = 'linux-x86_64';
    if (reqTarget === 'windows') {
      tauriOsKey = `windows-${reqArch}`;
    } else if (reqTarget === 'darwin') {
      tauriOsKey = `darwin-${reqArch}`;
    } else if (reqTarget === 'linux') {
      tauriOsKey = `linux-${reqArch}`;
    }

    // Read latest.json from storage (private bucket, service role)
    const { data: manifestData, error: manifestError } = await adminClient.storage
      .from('releases')
      .download('latest.json');

    if (manifestError || !manifestData) {
      return Response.json(
        { error: 'Failed to fetch release manifest' },
        { status: 404, headers: corsHeaders },
      );
    }

    const manifestText = await manifestData.text();
    const manifest = JSON.parse(manifestText);

    if (!manifest.version || typeof manifest.version !== 'string') {
      return Response.json(
        { error: 'Invalid manifest: missing or invalid version' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (!manifest.pub_date || typeof manifest.pub_date !== 'string') {
      return Response.json(
        { error: 'Invalid manifest: missing or invalid pub_date' },
        { status: 400, headers: corsHeaders },
      );
    }
    const version: string = manifest.version;
    const pubDate: string = manifest.pub_date;

    // Get platform entry from manifest
    const platformEntry = manifest.platforms?.[tauriOsKey];
    if (!platformEntry) {
      return Response.json(
        { error: `No assets found for platform: ${tauriOsKey}` },
        { status: 404, headers: corsHeaders },
      );
    }

    if (!platformEntry.url || typeof platformEntry.url !== 'string') {
      return Response.json(
        { error: 'Invalid manifest: missing or invalid url for platform' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (!platformEntry.signature || typeof platformEntry.signature !== 'string') {
      return Response.json(
        { error: 'Invalid manifest: missing or invalid signature for platform' },
        { status: 400, headers: corsHeaders },
      );
    }
    const publicUrl: string = platformEntry.url;
    const signature: string = platformEntry.signature;

    // Extract the path from the public URL for signed URL generation
    // URL format: https://{project}.supabase.co/storage/v1/object/public/releases/v{version}/{osArch}/{filename}
    // Path passed to createSignedUrl must be relative to bucket (strip /storage/v1/object/public/releases/)
    const urlObj = new URL(publicUrl);
    const publicPath = urlObj.pathname.replace('/storage/v1/object/public/releases/', '');

    // Generate signed URL for the binary (1 hour expiry)
    const { data: signedUrlData, error: signedError } = await adminClient.storage
      .from('releases')
      .createSignedUrl(publicPath, SIGNED_URL_EXPIRY_SECONDS);

    if (signedError || !signedUrlData) {
      console.error('Signed URL error:', signedError);
      return Response.json(
        { error: 'Failed to generate download URL' },
        { status: 500, headers: corsHeaders },
      );
    }

    // Return flat Tauri v2-compatible format
    const body = {
      version,
      pub_date: pubDate,
      url: signedUrlData.signedUrl,
      signature,
      notes: manifest.notes ?? 'Update available',
    };

    return Response.json(body, { headers: corsHeaders });
  } catch (error) {
    console.error('Updater error:', error);
    return Response.json(
      { error: 'Failed to process update request' },
      { status: 500, headers: corsHeaders },
    );
  }
});
