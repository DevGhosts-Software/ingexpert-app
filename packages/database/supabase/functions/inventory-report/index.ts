import { rgb } from 'npm:pdf-lib@1.17.1';
import {
  DEFAULT_TIME_ZONE,
  MARGIN,
  SECTION_GAP,
  calculateInventoryStocks,
  calculateStockSummary,
  corsHeaders,
  createAdminClient,
  createPagedWriter,
  drawStockSummary,
  escapePdfText,
  fetchStockLedger,
  formatDateForFileName,
  formatDateTime,
  formatStock,
  isAuthorized,
  json,
  splitText,
  startPdfDocument,
  uploadPdfIfConfigured,
} from '../_shared/pdf-report-utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Missing Supabase config' });
  }

  if (!(await isAuthorized(req, adminClient))) {
    return json(401, {
      error: 'Unauthorized. Provide a valid Bearer token or x-report-secret.',
    });
  }

  try {
    const stockLedgerRows = await fetchStockLedger(adminClient);
    const stockSummary = calculateStockSummary(stockLedgerRows);
    const inventoryRows = calculateInventoryStocks(stockLedgerRows);
    const generatedAt = new Date();

    const { pdfDoc, font, boldFont } = await startPdfDocument();
    const writer = createPagedWriter(pdfDoc);

    writer.drawText('Reporte General de Inventario', {
      x: MARGIN,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    writer.moveDown(24);

    writer.drawLines(
      [
        `Generado: ${formatDateTime(generatedAt, DEFAULT_TIME_ZONE)}`,
        `Zona horaria: ${DEFAULT_TIME_ZONE}`,
      ],
      MARGIN,
      10,
      font,
      rgb(0.35, 0.35, 0.35),
    );

    writer.moveDown(SECTION_GAP);
    drawStockSummary(writer, boldFont, stockSummary);

    writer.drawText('Detalle por item', {
      x: MARGIN,
      size: 14,
      font: boldFont,
    });
    writer.moveDown(20);

    if (inventoryRows.length === 0) {
      writer.drawLines(
        ['No se encontraron datos de inventario en el ledger de movimientos.'],
        MARGIN,
        11,
        font,
        rgb(0.35, 0.35, 0.35),
      );
    } else {
      for (const row of inventoryRows) {
        const header = `[${row.code}] ${row.name}`;
        const stockLine = `Total: ${formatStock(row.total)} ${row.unit} | Almacen: ${formatStock(row.warehouse)} ${row.unit} | Obra: ${formatStock(row.onsite)} ${row.unit}`;
        const wrappedHeader = splitText(header, 495, boldFont, 11);
        const wrappedStock = splitText(stockLine, 495, font, 10);
        const blockHeight = 14 + (wrappedHeader.length + wrappedStock.length) * 14;

        writer.ensureSpace(blockHeight + 10);
        writer.drawRectangle({
          x: MARGIN,
          y: writer.getY() - blockHeight + 8,
          width: 515,
          height: blockHeight,
          color: rgb(0.985, 0.985, 0.985),
          borderColor: rgb(0.88, 0.88, 0.88),
          borderWidth: 1,
        });
        writer.drawLines(wrappedHeader, MARGIN + 10, 11, boldFont);
        writer.drawLines(wrappedStock, MARGIN + 10, 10, font, rgb(0.25, 0.25, 0.25));
        writer.moveDown(10);
      }
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `inventory_overall_${formatDateForFileName(generatedAt, DEFAULT_TIME_ZONE)}.pdf`;
    const uploadedPath = await uploadPdfIfConfigured(
      adminClient,
      'inventory-reports',
      fileName,
      pdfBytes,
    );

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${escapePdfText(fileName) || 'inventory-report.pdf'}"`,
        'X-Report-Type': 'inventory-overall',
        'X-Report-Timezone': DEFAULT_TIME_ZONE,
        ...(uploadedPath ? { 'X-Storage-Path': uploadedPath } : {}),
      },
    });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : 'Unexpected inventory-report failure',
    });
  }
});
