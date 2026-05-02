import { rgb } from 'npm:pdf-lib@1.17.1';
import {
  DEFAULT_TIME_ZONE,
  MARGIN,
  PAGE_WIDTH,
  SECTION_GAP,
  buildReportMovements,
  calculateStockSummary,
  corsHeaders,
  createAdminClient,
  createPagedWriter,
  drawStockSummary,
  escapePdfText,
  fetchItemsByIds,
  fetchMovementDetails,
  fetchMovementsInPeriod,
  fetchProjectsByIds,
  fetchStockLedger,
  fetchUsersByIds,
  formatDateForFileName,
  formatDateTime,
  formatStock,
  getLastClosedSaturdayWindow,
  isAuthorized,
  json,
  movementTypeLabel,
  normalizeMovementType,
  splitText,
  startPdfDocument,
  unique,
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
    const period = getLastClosedSaturdayWindow(new Date(), DEFAULT_TIME_ZONE);
    const [stockLedgerRows, movementRows] = await Promise.all([
      fetchStockLedger(adminClient),
      fetchMovementsInPeriod(adminClient, period),
    ]);

    const stockSummary = calculateStockSummary(stockLedgerRows);
    const movementIds = movementRows.map((movement) => movement.id);

    let reportMovements = [];
    if (movementIds.length > 0) {
      const movementDetails = await fetchMovementDetails(adminClient, movementIds);
      const userIds = unique(
        movementRows.flatMap((movement) => [
          movement.created_by_id,
          movement.responsible_delivery_id,
          movement.responsible_receipt_id,
        ]),
      );
      const projectIds = unique(movementRows.map((movement) => movement.project_id));
      const itemIds = unique(movementDetails.map((detail) => detail.item_id));

      const [users, projects, items] = await Promise.all([
        userIds.length > 0 ? fetchUsersByIds(adminClient, userIds) : Promise.resolve(new Map()),
        projectIds.length > 0
          ? fetchProjectsByIds(adminClient, projectIds)
          : Promise.resolve(new Map()),
        itemIds.length > 0 ? fetchItemsByIds(adminClient, itemIds) : Promise.resolve(new Map()),
      ]);

      reportMovements = buildReportMovements(movementRows, movementDetails, users, projects, items);
    }

    const { pdfDoc, font, boldFont } = await startPdfDocument();
    const writer = createPagedWriter(pdfDoc, font, boldFont, 'Reporte Semanal de Movimientos');

    writer.drawText('Reporte Semanal de Movimientos', {
      x: MARGIN,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    writer.moveDown(24);

    writer.drawLines(
      [
        `Periodo de movimientos: ${formatDateTime(period.start, DEFAULT_TIME_ZONE)} -> ${formatDateTime(period.end, DEFAULT_TIME_ZONE)}`,
        `Zona horaria: ${DEFAULT_TIME_ZONE}`,
      ],
      MARGIN,
      10,
      font,
      rgb(0.35, 0.35, 0.35),
    );

    writer.moveDown(SECTION_GAP);
    drawStockSummary(writer, boldFont, stockSummary);

    writer.drawText('Movimientos del periodo', {
      x: MARGIN,
      size: 14,
      font: boldFont,
    });
    writer.moveDown(20);

    if (reportMovements.length === 0) {
      writer.drawLines(
        ['No se encontraron movimientos dentro del rango sabado 12:00 pm -> sabado 12:00 pm.'],
        MARGIN,
        11,
        font,
        rgb(0.35, 0.35, 0.35),
      );
    } else {
      for (const entry of reportMovements) {
        const movementType = normalizeMovementType(entry.movement.type);
        const headerLines = [
          `${formatDateTime(new Date(entry.movement.date), DEFAULT_TIME_ZONE)} | ${movementTypeLabel(movementType)}`,
          `Proyecto: ${entry.projectName} | Destino: ${escapePdfText(entry.movement.destination) || 'Sin destino'}`,
        ];
        const metaLines = [
          `Creado por: ${entry.creatorName}`,
          `Entrega: ${entry.deliveryName}`,
          `Recibe: ${entry.receiptName}`,
        ];
        const observationText = escapePdfText(entry.movement.observations) || 'Sin observaciones';
        const detailLines =
          entry.details.length > 0
            ? entry.details.map(
                (detail) =>
                  `- [${detail.itemCode}] ${detail.itemName}: ${formatStock(detail.quantity)} ${detail.unit}`,
              )
            : ['- Sin detalles'];

        const wrappedObservation = splitText(
          `Observaciones: ${observationText}`,
          PAGE_WIDTH - MARGIN * 2 - 10,
          font,
          10,
        );
        const wrappedDetailLines = detailLines.flatMap((line) =>
          splitText(line, PAGE_WIDTH - MARGIN * 2 - 18, font, 10),
        );

        const blockHeight =
          18 +
          headerLines.length * 14 +
          metaLines.length * 14 +
          wrappedObservation.length * 14 +
          wrappedDetailLines.length * 14 +
          14;

        writer.ensureSpace(blockHeight);
        writer.drawRectangle({
          x: MARGIN,
          y: writer.getY() - blockHeight + 8,
          width: PAGE_WIDTH - MARGIN * 2,
          height: blockHeight,
          color: rgb(0.985, 0.985, 0.985),
          borderColor: rgb(0.88, 0.88, 0.88),
          borderWidth: 1,
        });

        writer.drawLines(headerLines, MARGIN + 10, 11, boldFont);
        writer.drawLines(metaLines, MARGIN + 10, 10, font, rgb(0.25, 0.25, 0.25));
        writer.drawLines(wrappedObservation, MARGIN + 10, 10, font, rgb(0.25, 0.25, 0.25));
        writer.drawLines(wrappedDetailLines, MARGIN + 18, 10, font);
        writer.moveDown(10);
      }
    }

    writer.finalizeDocument(period.start, DEFAULT_TIME_ZONE);
    const pdfBytes = await pdfDoc.save();
    const fileName = `movement_weekly_${formatDateForFileName(period.start, DEFAULT_TIME_ZONE)}_${formatDateForFileName(period.end, DEFAULT_TIME_ZONE)}.pdf`;
    const uploadedPath = await uploadPdfIfConfigured(
      adminClient,
      'movement-reports',
      fileName,
      pdfBytes,
    );

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${escapePdfText(fileName) || 'movement-report.pdf'}"`,
        'X-Report-Type': 'movement-weekly',
        'X-Report-Start': period.start.toISOString(),
        'X-Report-End': period.end.toISOString(),
        'X-Report-Timezone': DEFAULT_TIME_ZONE,
        ...(uploadedPath ? { 'X-Storage-Path': uploadedPath } : {}),
      },
    });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : 'Unexpected movement-report failure',
    });
  }
});
