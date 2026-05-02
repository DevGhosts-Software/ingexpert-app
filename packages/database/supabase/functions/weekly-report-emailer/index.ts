import {
  corsHeaders,
  createAdminClient,
  isAuthorized,
  json,
} from '../_shared/pdf-report-utils.ts';

type SuccessfulReport = { ok: true; fileName: string; bytes: Uint8Array };
type FailedReport = { ok: false; error: string };
type ReportResult = SuccessfulReport | FailedReport;

type EmailResult = { email: string; sent: boolean; error?: string };

function encodeBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binString);
}

async function fetchReport(url: string, secret: string): Promise<ReportResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'x-report-secret': secret },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Report fetch failed: ${url} - HTTP ${response.status}`, errorBody);
      return { ok: false, error: `HTTP ${response.status}: ${errorBody.slice(0, 200)}` };
    }

    const contentDisposition = response.headers.get('Content-Disposition') || '';
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const fileName = match?.[1] || 'report.pdf';
    const bytes = new Uint8Array(await response.arrayBuffer());

    return { ok: true, fileName, bytes };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Report fetch exception: ${url}`, message);
    return { ok: false, error: message };
  }
}

async function sendReportEmail(options: {
  to: string;
  name: string | null;
  movementAttachment?: SuccessfulReport;
  inventoryAttachment?: SuccessfulReport;
}): Promise<{ success: boolean; error?: string }> {
  const attachments: Array<{ filename: string; content: Uint8Array; contentType: string }> = [];
  if (options.movementAttachment) {
    attachments.push({
      filename: options.movementAttachment.fileName,
      content: options.movementAttachment.bytes,
      contentType: 'application/pdf',
    });
  }
  if (options.inventoryAttachment) {
    attachments.push({
      filename: options.inventoryAttachment.fileName,
      content: options.inventoryAttachment.bytes,
      contentType: 'application/pdf',
    });
  }

  const hasMovement = !!options.movementAttachment;
  const hasInventory = !!options.inventoryAttachment;

  const subject = 'Reportes Semanales - Ingexpert';
  const textBody = `Hola ${options.name || 'Administrador'},\n\n` +
    `Adjunto encontrarás los reportes semanales de Ingexpert:\n\n` +
    `${hasMovement ? '- Reporte de Movimientos' : '- Reporte de Movimientos: No disponible'}\n` +
    `${hasInventory ? '- Reporte de Inventario' : '- Reporte de Inventario: No disponible'}\n\n` +
    `Saludos,\nEquipo Ingexpert`;

  // Mail bridge configuration
  const mailApiUrl = Deno.env.get('MAIL_API_URL');
  const mailApiKey = Deno.env.get('MAIL_API_KEY');
  const smtpFromEmail = Deno.env.get('SMTP_FROM_EMAIL');
  const smtpFromName = Deno.env.get('SMTP_FROM_NAME') ?? 'Ingexpert';

  if (!mailApiUrl || !mailApiKey || !smtpFromEmail) {
    console.log('[EMAIL PLACEHOLDER] MAIL_API_URL or MAIL_API_KEY not configured.');
    console.log('  To:', options.to);
    console.log('  Subject:', subject);
    console.log('  Attachments:', attachments.map((a) => a.filename).join(', '));
    return { success: true };
  }

  try {
    const htmlBody = `<p>Hola ${options.name || 'Administrador'},</p>
<p>Adjunto encontrarás los reportes semanales de Ingexpert:</p>
<ul>
  ${hasMovement ? '<li>Reporte de Movimientos</li>' : '<li>Reporte de Movimientos: <em>No disponible</em></li>'}
  ${hasInventory ? '<li>Reporte de Inventario</li>' : '<li>Reporte de Inventario: <em>No disponible</em></li>'}
</ul>
<p>Saludos,<br>Equipo Ingexpert</p>`;

    const response = await fetch(mailApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': mailApiKey,
      },
      body: JSON.stringify({
        from: `"${smtpFromName}" <${smtpFromEmail}>`,
        to: options.to,
        subject,
        text: textBody,
        html: htmlBody,
        attachments: attachments.map((a) => ({
          filename: a.filename,
          content: encodeBase64(a.content),
          contentType: a.contentType,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Mail API send failed for', options.to, message);
    return { success: false, error: message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : 'Missing Supabase config',
    });
  }

  if (!(await isAuthorized(req, adminClient))) {
    return json(401, {
      error: 'Unauthorized. Provide a valid Bearer token or x-report-secret.',
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const reportSecret = Deno.env.get('PDF_REPORTS_CRON_SECRET');

    if (!supabaseUrl || !reportSecret) {
      return json(500, { error: 'Missing SUPABASE_URL or PDF_REPORTS_CRON_SECRET' });
    }

    // 1. Fetch admin recipients
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('email, name')
      .in('role', ['ADMIN', 'SUPERADMIN'])
      .not('email', 'is', null);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    const recipients = (users ?? []).filter((u) => u.email && u.email.includes('@'));

    if (recipients.length === 0) {
      return json(200, {
        success: true,
        message: 'No ADMIN or SUPERADMIN recipients found',
        recipientsTotal: 0,
        emailsSent: 0,
        emailsFailed: 0,
      });
    }

    // 2. Call report functions
    const [movementResult, inventoryResult] = await Promise.all([
      fetchReport(`${supabaseUrl}/functions/v1/movement-report`, reportSecret),
      fetchReport(`${supabaseUrl}/functions/v1/inventory-report`, reportSecret),
    ]);

    if (!movementResult.ok && !inventoryResult.ok) {
      return json(502, {
        error: 'Both report functions failed',
        movement: movementResult,
        inventory: inventoryResult,
      });
    }

    // 3. Send emails
    const emailResults: EmailResult[] = [];
    for (const user of recipients) {
      const result = await sendReportEmail({
        to: user.email,
        name: user.name,
        movementAttachment: movementResult.ok ? movementResult : undefined,
        inventoryAttachment: inventoryResult.ok ? inventoryResult : undefined,
      });
      emailResults.push({
        email: user.email,
        sent: result.success,
        error: result.error,
      });
    }

    const emailsSent = emailResults.filter((r) => r.sent).length;
    const emailsFailed = emailResults.filter((r) => !r.sent).length;

    return json(200, {
      success: emailsFailed === 0,
      recipientsTotal: recipients.length,
      emailsSent,
      emailsFailed,
      reports: {
        movement: {
          success: movementResult.ok,
          fileName: movementResult.ok ? movementResult.fileName : undefined,
          bytes: movementResult.ok ? movementResult.bytes.length : undefined,
          error: !movementResult.ok ? movementResult.error : undefined,
        },
        inventory: {
          success: inventoryResult.ok,
          fileName: inventoryResult.ok ? inventoryResult.fileName : undefined,
          bytes: inventoryResult.ok ? inventoryResult.bytes.length : undefined,
          error: !inventoryResult.ok ? inventoryResult.error : undefined,
        },
      },
      details: emailResults,
    });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : 'Unexpected weekly-report-emailer failure',
    });
  }
});
