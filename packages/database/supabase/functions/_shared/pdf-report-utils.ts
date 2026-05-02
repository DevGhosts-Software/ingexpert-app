import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'npm:pdf-lib@1.17.1';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-report-secret',
};

export const PAGE_SIZE = 1000;
export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 40;
export const LINE_HEIGHT = 14;
export const HEADER_RIGHT_PADDING = 150;
export const SECTION_GAP = 18;
export const DEFAULT_TIME_ZONE = Deno.env.get('PDF_REPORTS_TIMEZONE') ?? 'America/La_Paz';

export type MovementType =
  | 'EXIT'
  | 'PURCHASE'
  | 'RETURN'
  | 'WRITEOFF'
  | 'STOCK_ADJUSTMENT_IN'
  | 'STOCK_ADJUSTMENT_OUT'
  | 'EXCEL_IMPORT';

export type MovementRow = {
  id: string;
  type: string | null;
  created_by_id: string | null;
  destination: string | null;
  observations: string | null;
  responsible_delivery_id: string | null;
  responsible_receipt_id: string | null;
  date: string;
  project_id: string | null;
};

export type MovementDetailRow = {
  movement_id: string;
  item_id: string;
  quantity: number | string | null;
};

export type StockLedgerRow = {
  item_id: string;
  quantity: number | string | null;
  items:
    | {
        code?: string | null;
        name?: string | null;
        unit?: string | null;
      }
    | Array<{
        code?: string | null;
        name?: string | null;
        unit?: string | null;
      }>
    | null;
  movements:
    | {
        type?: string | null;
      }
    | Array<{
        type?: string | null;
      }>
    | null;
};

export type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
};

export type ProjectRow = {
  id: string;
  name: string | null;
};

export type ItemRow = {
  id: string;
  code: string | null;
  name: string | null;
  unit: string | null;
};

export type ReportMovement = {
  movement: MovementRow;
  details: Array<{
    quantity: number;
    itemCode: string;
    itemName: string;
    unit: string;
  }>;
  creatorName: string;
  deliveryName: string;
  receiptName: string;
  projectName: string;
};

export type StockSummary = {
  warehouse: number;
  onsite: number;
  total: number;
};

export type InventoryStockRow = {
  itemId: string;
  code: string;
  name: string;
  unit: string;
  warehouse: number;
  onsite: number;
  total: number;
};

type TimeZoneParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
};

export const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

export const normalizeMovementType = (value: string | null | undefined): MovementType | null => {
  switch ((value ?? '').trim().toUpperCase()) {
    case 'EXIT':
      return 'EXIT';
    case 'PURCHASE':
      return 'PURCHASE';
    case 'RETURN':
      return 'RETURN';
    case 'WRITEOFF':
      return 'WRITEOFF';
    case 'STOCK_ADJUSTMENT_IN':
      return 'STOCK_ADJUSTMENT_IN';
    case 'STOCK_ADJUSTMENT_OUT':
      return 'STOCK_ADJUSTMENT_OUT';
    case 'EXCEL_IMPORT':
      return 'EXCEL_IMPORT';
    default:
      return null;
  }
};

export const movementTypeLabel = (type: MovementType | null): string => {
  switch (type) {
    case 'PURCHASE':
      return 'Compra';
    case 'RETURN':
      return 'Devolucion';
    case 'EXIT':
      return 'Salida';
    case 'WRITEOFF':
      return 'Baja';
    case 'STOCK_ADJUSTMENT_IN':
      return 'Ajuste de stock (entrada)';
    case 'STOCK_ADJUSTMENT_OUT':
      return 'Ajuste de stock (salida)';
    case 'EXCEL_IMPORT':
      return 'Importacion Excel';
    default:
      return 'Desconocido';
  }
};

export const escapePdfText = (value: string | null | undefined): string =>
  (value ?? '').replace(/\s+/g, ' ').trim();

const numberFormatter = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

export const formatDateTime = (value: Date, timeZone: string): string => {
  const cacheKey = `${timeZone}:datetime`;
  let formatter = dateFormatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('es-BO', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    dateFormatterCache.set(cacheKey, formatter);
  }
  return formatter.format(value);
};

export const formatDateForFileName = (value: Date, timeZone: string): string => {
  const parts = getTimeZoneParts(value, timeZone);
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  const hour = String(parts.hour).padStart(2, '0');
  const minute = String(parts.minute).padStart(2, '0');
  return `${parts.year}-${month}-${day}_${hour}${minute}`;
};

export const formatStock = (value: number): string => numberFormatter.format(value);

const getBearerToken = (req: Request): string | null => {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!header) return null;
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
};

export const createAdminClient = (): ReturnType<typeof createClient> => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const isAuthorized = async (
  req: Request,
  adminClient: ReturnType<typeof createClient>,
): Promise<boolean> => {
  const configuredSecret = Deno.env.get('PDF_REPORTS_CRON_SECRET')?.trim();
  const providedSecret = req.headers.get('x-report-secret')?.trim();

  if (configuredSecret && providedSecret && providedSecret === configuredSecret) {
    return true;
  }

  const token = getBearerToken(req);
  if (!token) return false;

  const { data, error } = await adminClient.auth.getUser(token);
  return !error && !!data.user?.id;
};

export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const page = await fetchPage(from, from + PAGE_SIZE - 1);
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

export const chunk = <T>(input: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < input.length; i += size) {
    chunks.push(input.slice(i, i + size));
  }
  return chunks;
};

export const unique = (values: Array<string | null | undefined>): string[] =>
  [
    ...new Set(
      values.filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  ];

const getEmbeddedMovementType = (row: StockLedgerRow): MovementType | null => {
  if (Array.isArray(row.movements)) return normalizeMovementType(row.movements[0]?.type);
  return normalizeMovementType(row.movements?.type);
};

const getEmbeddedItem = (
  row: StockLedgerRow,
): { code?: string | null; name?: string | null; unit?: string | null } | null => {
  if (Array.isArray(row.items)) return row.items[0] ?? null;
  return row.items ?? null;
};

const getTimeZoneParts = (date: Date, timeZone: string): TimeZoneParts => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  });

  const partMap = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(partMap.year),
    month: Number(partMap.month),
    day: Number(partMap.day),
    hour: Number(partMap.hour),
    minute: Number(partMap.minute),
    second: Number(partMap.second),
    weekday: weekdayMap[String(partMap.weekday)] ?? 0,
  };
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string): number => {
  const parts = getTimeZoneParts(date, timeZone);
  const utcFromParts = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return utcFromParts - date.getTime();
};

const zonedDateTimeToUtc = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date => {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getTimeZoneOffsetMs(guess, timeZone);
  return new Date(guess.getTime() - offset);
};

const shiftCalendarDate = (
  year: number,
  month: number,
  day: number,
  deltaDays: number,
): { year: number; month: number; day: number } => {
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + deltaDays);
  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
  };
};

export const getLastClosedSaturdayWindow = (
  now: Date,
  timeZone: string,
): { start: Date; end: Date } => {
  const parts = getTimeZoneParts(now, timeZone);
  const isSaturdayAfterNoon =
    parts.weekday === 6 && (parts.hour > 12 || (parts.hour === 12 && parts.minute >= 0));
  const daysBack = parts.weekday === 6 ? (isSaturdayAfterNoon ? 0 : 7) : (parts.weekday + 1) % 7;

  const endLocalDate = shiftCalendarDate(parts.year, parts.month, parts.day, -daysBack);
  const startLocalDate = shiftCalendarDate(
    endLocalDate.year,
    endLocalDate.month,
    endLocalDate.day,
    -7,
  );

  return {
    start: zonedDateTimeToUtc(
      startLocalDate.year,
      startLocalDate.month,
      startLocalDate.day,
      12,
      0,
      0,
      timeZone,
    ),
    end: zonedDateTimeToUtc(
      endLocalDate.year,
      endLocalDate.month,
      endLocalDate.day,
      12,
      0,
      0,
      timeZone,
    ),
  };
};

export const calculateStockSummary = (rows: StockLedgerRow[]): StockSummary => {
  let warehouse = 0;
  let onsite = 0;

  for (const row of rows) {
    const quantity = Math.abs(Number(row.quantity ?? 0));
    const type = getEmbeddedMovementType(row);

    if (
      type === 'PURCHASE' ||
      type === 'RETURN' ||
      type === 'EXCEL_IMPORT' ||
      type === 'STOCK_ADJUSTMENT_IN'
    ) {
      warehouse += quantity;
    } else if (type === 'EXIT' || type === 'WRITEOFF' || type === 'STOCK_ADJUSTMENT_OUT') {
      warehouse -= quantity;
    }

    if (type === 'EXIT') onsite += quantity;
    else if (type === 'RETURN') onsite -= quantity;
  }

  return { warehouse, onsite, total: warehouse + onsite };
};

export const calculateInventoryStocks = (rows: StockLedgerRow[]): InventoryStockRow[] => {
  const byItem = new Map<string, InventoryStockRow>();

  for (const row of rows) {
    const item = getEmbeddedItem(row);
    const quantity = Math.abs(Number(row.quantity ?? 0));
    const type = getEmbeddedMovementType(row);

    const current =
      byItem.get(row.item_id) ??
      {
        itemId: row.item_id,
        code: escapePdfText(item?.code) || row.item_id,
        name: escapePdfText(item?.name) || 'Item sin nombre',
        unit: escapePdfText(item?.unit) || 'unidad',
        warehouse: 0,
        onsite: 0,
        total: 0,
      };

    if (
      type === 'PURCHASE' ||
      type === 'RETURN' ||
      type === 'EXCEL_IMPORT' ||
      type === 'STOCK_ADJUSTMENT_IN'
    ) {
      current.warehouse += quantity;
    } else if (type === 'EXIT' || type === 'WRITEOFF' || type === 'STOCK_ADJUSTMENT_OUT') {
      current.warehouse -= quantity;
    }

    if (type === 'EXIT') current.onsite += quantity;
    else if (type === 'RETURN') current.onsite -= quantity;

    current.total = current.warehouse + current.onsite;
    byItem.set(row.item_id, current);
  }

  return [...byItem.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
};

export const buildReportMovements = (
  movements: MovementRow[],
  details: MovementDetailRow[],
  users: Map<string, UserRow>,
  projects: Map<string, ProjectRow>,
  items: Map<string, ItemRow>,
): ReportMovement[] => {
  const detailsByMovementId = new Map<string, MovementDetailRow[]>();
  for (const detail of details) {
    const current = detailsByMovementId.get(detail.movement_id) ?? [];
    current.push(detail);
    detailsByMovementId.set(detail.movement_id, current);
  }

  return movements.map((movement) => {
    const creator = movement.created_by_id ? users.get(movement.created_by_id) : undefined;
    const delivery = movement.responsible_delivery_id
      ? users.get(movement.responsible_delivery_id)
      : undefined;
    const receipt = movement.responsible_receipt_id
      ? users.get(movement.responsible_receipt_id)
      : undefined;
    const project = movement.project_id ? projects.get(movement.project_id) : undefined;

    const movementDetails = (detailsByMovementId.get(movement.id) ?? [])
      .map((detail) => {
        const item = items.get(detail.item_id);
        return {
          quantity: Number(detail.quantity ?? 0),
          itemCode: escapePdfText(item?.code) || detail.item_id,
          itemName: escapePdfText(item?.name) || 'Item sin nombre',
          unit: escapePdfText(item?.unit) || 'unidad',
        };
      })
      .sort((a, b) => a.itemName.localeCompare(b.itemName, 'es'));

    return {
      movement,
      details: movementDetails,
      creatorName: escapePdfText(creator?.name) || escapePdfText(creator?.email) || 'Sin dato',
      deliveryName: escapePdfText(delivery?.name) || escapePdfText(delivery?.email) || 'Sin dato',
      receiptName: escapePdfText(receipt?.name) || escapePdfText(receipt?.email) || 'Sin dato',
      projectName: escapePdfText(project?.name) || 'Sin proyecto',
    };
  });
};

export const splitText = (text: string, maxWidth: number, font: PDFFont, size: number): string[] => {
  const normalized = escapePdfText(text);
  if (!normalized) return [''];

  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
      continue;
    }

    let remaining = word;
    while (remaining.length > 0) {
      let sliceLength = remaining.length;
      while (
        sliceLength > 1 &&
        font.widthOfTextAtSize(remaining.slice(0, sliceLength), size) > maxWidth
      ) {
        sliceLength -= 1;
      }
      lines.push(remaining.slice(0, sliceLength));
      remaining = remaining.slice(sliceLength);
    }
    current = '';
  }

  if (current) lines.push(current);
  return lines;
};

export const startPdfDocument = async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  return { pdfDoc, font, boldFont };
};

export const HEADER_HEIGHT = 60;
export const FOOTER_HEIGHT = 30;
export const CONTENT_TOP = PAGE_HEIGHT - MARGIN - HEADER_HEIGHT;
export const CONTENT_BOTTOM = MARGIN + FOOTER_HEIGHT;

export const createPagedWriter = (
  pdfDoc: PDFDocument,
  font: PDFFont,
  boldFont: PDFFont,
  reportTitle: string,
): {
  ensureSpace: (height: number) => void;
  drawLines: (lines: string[], x: number, size: number, font: PDFFont, color?: ReturnType<typeof rgb>) => void;
  drawRectangle: (options: { x: number; y: number; width: number; height: number; color: ReturnType<typeof rgb>; borderColor: ReturnType<typeof rgb>; borderWidth: number }) => void;
  drawText: (text: string, options: { x: number; size: number; font: PDFFont; color?: ReturnType<typeof rgb> }) => void;
  moveDown: (amount: number) => void;
  getY: () => number;
  setY: (value: number) => void;
  finalizeDocument: (generatedAt: Date, timeZone: string) => void;
} => {
  const pages: PDFPage[] = [];
  let page: PDFPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pages.push(page);
  let y = CONTENT_TOP;

  const drawHeader = (p: PDFPage) => {
    p.drawText('INGEXPERT', { x: MARGIN, y: PAGE_HEIGHT - MARGIN - 14, size: 14, font: boldFont, color: rgb(0, 0, 0) });
    p.drawText(reportTitle, { x: PAGE_WIDTH - MARGIN - HEADER_RIGHT_PADDING, y: PAGE_HEIGHT - MARGIN - 14, size: 10, font: boldFont, color: rgb(0.5, 0.5, 0.5) });
    p.drawLine({
      start: { x: MARGIN, y: PAGE_HEIGHT - MARGIN - 20 },
      end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - MARGIN - 20 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
  };

  drawHeader(page);

  const ensureSpace = (requiredHeight: number) => {
    if (y - requiredHeight < CONTENT_BOTTOM) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pages.push(page);
      y = CONTENT_TOP;
      drawHeader(page);
    }
  };

  return {
    ensureSpace,
    drawLines: (lines, x, size, f, color = rgb(0, 0, 0)) => {
      for (const line of lines) {
        ensureSpace(LINE_HEIGHT);
        page.drawText(line, { x, y, size, font: f, color });
        y -= LINE_HEIGHT;
      }
    },
    drawRectangle: (options) => {
      page.drawRectangle(options);
    },
    drawText: (text, options) => {
      page.drawText(text, { ...options, y, color: options.color ?? rgb(0, 0, 0) });
      y -= LINE_HEIGHT;
    },
    moveDown: (amount) => {
      y -= amount;
    },
    getY: () => y,
    setY: (value) => {
      y = value;
    },
    finalizeDocument: (generatedAt: Date, timeZone: string) => {
      const dateStr = formatDateTime(generatedAt, timeZone);
      const totalPages = pages.length;
      pages.forEach((p, i) => {
        const pageNum = i + 1;
        p.drawText(`Generado: ${dateStr}`, { x: MARGIN, y: MARGIN + 8, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
        p.drawText(`Página ${pageNum} / ${totalPages}`, { x: PAGE_WIDTH - MARGIN - 80, y: MARGIN + 8, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
      });
    },
  };
};

export const drawStockSummary = (
  writer: ReturnType<typeof createPagedWriter>,
  boldFont: PDFFont,
  stock: StockSummary,
) => {
  writer.ensureSpace(90);
  writer.drawText('Resumen de stock actual', {
    x: MARGIN,
    size: 14,
    font: boldFont,
  });
  writer.moveDown(20);

  const stockBoxWidth = (PAGE_WIDTH - MARGIN * 2 - 16) / 3;
  const stockBoxes = [
    { label: 'TOTAL', value: formatStock(stock.total) },
    { label: 'EN ALMACEN', value: formatStock(stock.warehouse) },
    { label: 'EN OBRA', value: formatStock(stock.onsite) },
  ];

  stockBoxes.forEach((box, index) => {
    const x = MARGIN + index * (stockBoxWidth + 8);
    writer.drawRectangle({
      x,
      y: writer.getY() - 52,
      width: stockBoxWidth,
      height: 52,
      color: rgb(0.96, 0.96, 0.96),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1,
    });
    const baseY = writer.getY();
    writer.setY(baseY - 16);
    writer.drawText(box.label, {
      x: x + 10,
      size: 9,
      font: boldFont,
      color: rgb(0.35, 0.35, 0.35),
    });
    writer.setY(baseY - 38);
    writer.drawText(box.value, {
      x: x + 10,
      size: 16,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    writer.setY(baseY);
  });

  writer.moveDown(72);
};

export const fetchStockLedger = async (
  adminClient: ReturnType<typeof createClient>,
): Promise<StockLedgerRow[]> =>
  fetchAllPages(async (from, to) => {
    const { data, error } = await adminClient
      .from('movement_details')
      .select('item_id,quantity,items(code,name,unit),movements(type)')
      .range(from, to);

    if (error) throw new Error(`No se pudo leer el ledger de stock: ${error.message}`);
    return (data ?? []) as StockLedgerRow[];
  });

export const fetchMovementsInPeriod = async (
  adminClient: ReturnType<typeof createClient>,
  period: { start: Date; end: Date },
): Promise<MovementRow[]> =>
  fetchAllPages(async (from, to) => {
    const { data, error } = await adminClient
      .from('movements')
      .select(
        'id,type,created_by_id,destination,observations,responsible_delivery_id,responsible_receipt_id,date,project_id',
      )
      .gte('date', period.start.toISOString())
      .lt('date', period.end.toISOString())
      .order('date', { ascending: true })
      .range(from, to);

    if (error) throw new Error(`No se pudieron leer los movimientos del periodo: ${error.message}`);
    return (data ?? []) as MovementRow[];
  });

export const fetchMovementDetails = async (
  adminClient: ReturnType<typeof createClient>,
  movementIds: string[],
): Promise<MovementDetailRow[]> => {
  const detailChunks = chunk(movementIds, 100);
  const rows: MovementDetailRow[] = [];

  for (const ids of detailChunks) {
    const data = await fetchAllPages(async (from, to) => {
      const { data, error } = await adminClient
        .from('movement_details')
        .select('movement_id,item_id,quantity')
        .in('movement_id', ids)
        .range(from, to);

      if (error) throw new Error(`No se pudieron leer los detalles del movimiento: ${error.message}`);
      return (data ?? []) as MovementDetailRow[];
    });
    rows.push(...data);
  }

  return rows;
};

export const fetchUsersByIds = async (
  adminClient: ReturnType<typeof createClient>,
  ids: string[],
): Promise<Map<string, UserRow>> => {
  const map = new Map<string, UserRow>();
  for (const group of chunk(ids, 100)) {
    const { data, error } = await adminClient.from('users').select('id,name,email').in('id', group);
    if (error) throw new Error(`No se pudieron leer los usuarios del reporte: ${error.message}`);
    for (const row of (data ?? []) as UserRow[]) map.set(row.id, row);
  }
  return map;
};

export const fetchProjectsByIds = async (
  adminClient: ReturnType<typeof createClient>,
  ids: string[],
): Promise<Map<string, ProjectRow>> => {
  const map = new Map<string, ProjectRow>();
  for (const group of chunk(ids, 100)) {
    const { data, error } = await adminClient.from('projects').select('id,name').in('id', group);
    if (error) throw new Error(`No se pudieron leer los proyectos del reporte: ${error.message}`);
    for (const row of (data ?? []) as ProjectRow[]) map.set(row.id, row);
  }
  return map;
};

export const fetchItemsByIds = async (
  adminClient: ReturnType<typeof createClient>,
  ids: string[],
): Promise<Map<string, ItemRow>> => {
  const map = new Map<string, ItemRow>();
  for (const group of chunk(ids, 100)) {
    const { data, error } = await adminClient.from('items').select('id,code,name,unit').in('id', group);
    if (error) throw new Error(`No se pudieron leer los items del reporte: ${error.message}`);
    for (const row of (data ?? []) as ItemRow[]) map.set(row.id, row);
  }
  return map;
};

export const uploadPdfIfConfigured = async (
  adminClient: ReturnType<typeof createClient>,
  subfolder: string,
  fileName: string,
  pdfBytes: Uint8Array,
): Promise<string | null> => {
  const bucketName = Deno.env.get('PDF_REPORTS_BUCKET')?.trim();
  if (!bucketName) return null;

  const path = `${subfolder}/${fileName}`;
  const { error } = await adminClient.storage.from(bucketName).upload(path, pdfBytes, {
    contentType: 'application/pdf',
    upsert: true,
  });

  if (error) throw new Error(`No se pudo guardar el PDF en storage: ${error.message}`);
  return path;
};
