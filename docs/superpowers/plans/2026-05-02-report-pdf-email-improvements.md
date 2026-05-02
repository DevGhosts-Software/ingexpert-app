# Report PDF & Email Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix PDF card overflow, add Ingexpert header/footer to all pages, replace movement stock summary with type aggregates, and upgrade weekly report email to professional inline-CSS HTML.

**Architecture:** Refactor the shared `createPagedWriter` into a proper page manager with automatic header/footer drawing. Add a `drawCard` helper that fixes the overflow bug. Add aggregate calculation and email HTML builders to the shared utils. Update the three report functions to use the new helpers.

**Tech Stack:** Deno, pdf-lib, Supabase Edge Functions

---

## File Structure

| File | Responsibility |
|------|---------------|
| `packages/database/supabase/functions/_shared/pdf-report-utils.ts` | Shared utilities: page manager, card drawer, aggregate calculator, email HTML builder |
| `packages/database/supabase/functions/movement-report/index.ts` | Movement report endpoint: uses aggregates + drawCard |
| `packages/database/supabase/functions/inventory-report/index.ts` | Inventory report endpoint: uses drawCard |
| `packages/database/supabase/functions/weekly-report-emailer/index.ts` | Email sender: uses buildReportEmailHtml |

---

## Task 1: Refactor createPagedWriter with Header/Footer Zones

**Files:**
- Modify: `packages/database/supabase/functions/_shared/pdf-report-utils.ts`

The current `createPagedWriter` manages a single `page` and `y` cursor. We upgrade it to:
- Reserve header (60px) and footer (30px) zones
- Auto-draw header on every new page including page 1
- Track all pages for final footer drawing
- Return a `finalizeDocument(reportTitle, generatedAt)` method

- [ ] **Step 1: Replace createPagedWriter with new implementation**

Replace the existing `createPagedWriter` function (lines ~577-621) with:

```ts
export const HEADER_HEIGHT = 60;
export const FOOTER_HEIGHT = 30;
export const CONTENT_TOP = PAGE_HEIGHT - MARGIN - HEADER_HEIGHT;
export const CONTENT_BOTTOM = MARGIN + FOOTER_HEIGHT;

export const createPagedWriter = (
  pdfDoc: PDFDocument,
  boldFont: PDFFont,
  reportTitle: string,
) => {
  let page: PDFPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = CONTENT_TOP;
  const pages: PDFPage[] = [page];

  const drawHeader = (targetPage: PDFPage) => {
    // Brand left
    targetPage.drawText('INGEXPERT', {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - 14,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    // Title right
    targetPage.drawText(reportTitle, {
      x: PAGE_WIDTH - MARGIN - boldFont.widthOfTextAtSize(reportTitle, 10),
      y: PAGE_HEIGHT - MARGIN - 14,
      size: 10,
      font: boldFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    // Separator line
    targetPage.drawLine({
      start: { x: MARGIN, y: PAGE_HEIGHT - MARGIN - 22 },
      end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - MARGIN - 22 },
      thickness: 0.5,
      color: rgb(0.75, 0.75, 0.75),
    });
  };

  // Draw header on first page immediately
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
    drawLines: (lines: string[], x: number, size: number, font: PDFFont, color = rgb(0, 0, 0)) => {
      for (const line of lines) {
        ensureSpace(LINE_HEIGHT);
        page.drawText(line, { x, y, size, font, color });
        y -= LINE_HEIGHT;
      }
    },
    drawRectangle: (options: { x: number; y: number; width: number; height: number; color: ReturnType<typeof rgb>; borderColor: ReturnType<typeof rgb>; borderWidth: number }) => {
      page.drawRectangle(options);
    },
    drawText: (text: string, options: { x: number; size: number; font: PDFFont; color?: ReturnType<typeof rgb> }) => {
      page.drawText(text, { ...options, y, color: options.color ?? rgb(0, 0, 0) });
    },
    moveDown: (amount: number) => {
      y -= amount;
    },
    getY: () => y,
    setY: (value: number) => {
      y = value;
    },
    finalizeDocument: (generatedAt: Date, timeZone: string) => {
      const totalPages = pages.length;
      const generatedText = `Generado: ${formatDateTime(generatedAt, timeZone)}`;
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        const pageText = `Página ${i + 1} / ${totalPages}`;
        // Left: generated at
        p.drawText(generatedText, {
          x: MARGIN,
          y: MARGIN + 4,
          size: 8,
          font,
          color: rgb(0.55, 0.55, 0.55),
        });
        // Right: page number
        p.drawText(pageText, {
          x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(pageText, 8),
          y: MARGIN + 4,
          size: 8,
          font,
          color: rgb(0.55, 0.55, 0.55),
        });
      }
    },
  };
};
```

**Note:** The `finalizeDocument` method requires access to `font` (the regular font). Since `createPagedWriter` now receives `boldFont`, we should also pass `font` or use the existing closure. Update the signature to accept both fonts:

```ts
export const createPagedWriter = (
  pdfDoc: PDFDocument,
  font: PDFFont,
  boldFont: PDFFont,
  reportTitle: string,
) => { ... };
```

- [ ] **Step 2: Update callers of createPagedWriter in the same file**

The `drawStockSummary` function currently calls `writer.getY()` etc. It does not call `createPagedWriter`, so no changes needed there. The external callers in `movement-report` and `inventory-report` will be updated in later tasks.

- [ ] **Step 3: Commit**

```bash
git add packages/database/supabase/functions/_shared/pdf-report-utils.ts
git commit -m "feat(reports): refactor createPagedWriter with header/footer zones"
```

---

## Task 2: Add drawCard Helper

**Files:**
- Modify: `packages/database/supabase/functions/_shared/pdf-report-utils.ts`

- [ ] **Step 1: Add drawCard function after createPagedWriter**

```ts
export type CardLine = {
  text: string;
  font: PDFFont;
  size: number;
  color?: ReturnType<typeof rgb>;
};

export const drawCard = (
  writer: ReturnType<typeof createPagedWriter>,
  lines: CardLine[],
  options: {
    padding?: number;
    gap?: number;
    backgroundColor?: ReturnType<typeof rgb>;
    borderColor?: ReturnType<typeof rgb>;
    borderWidth?: number;
  } = {},
): void => {
  const padding = options.padding ?? 10;
  const gap = options.gap ?? 10;
  const backgroundColor = options.backgroundColor ?? rgb(0.985, 0.985, 0.985);
  const borderColor = options.borderColor ?? rgb(0.88, 0.88, 0.88);
  const borderWidth = options.borderWidth ?? 1;

  // Calculate text height: each line contributes its size * 1.2
  const textHeight = lines.reduce((sum, line) => sum + line.size * 1.2, 0);
  const cardHeight = textHeight + padding * 2;

  writer.ensureSpace(cardHeight + gap);
  const startY = writer.getY();

  // Draw rectangle: bottom-left at (MARGIN, startY - cardHeight)
  writer.drawRectangle({
    x: MARGIN,
    y: startY - cardHeight,
    width: PAGE_WIDTH - MARGIN * 2,
    height: cardHeight,
    color: backgroundColor,
    borderColor,
    borderWidth,
  });

  // Draw text inside the rectangle
  let textY = startY - padding;
  for (const line of lines) {
    writer.setY(textY);
    writer.drawText(line.text, {
      x: MARGIN + padding,
      size: line.size,
      font: line.font,
      color: line.color ?? rgb(0.1, 0.1, 0.1),
    });
    textY -= line.size * 1.2;
  }

  writer.setY(startY - cardHeight - gap);
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/database/supabase/functions/_shared/pdf-report-utils.ts
git commit -m "feat(reports): add drawCard helper with proper padding"
```

---

## Task 3: Add Movement Aggregate Calculation and Drawing

**Files:**
- Modify: `packages/database/supabase/functions/_shared/pdf-report-utils.ts`

- [ ] **Step 1: Add MovementAggregate types and calculateMovementAggregates**

Add after the `InventoryStockRow` type definition (around line 116):

```ts
export type MovementAggregate = {
  totalMovements: number;
  totalItemsMoved: number;
  distinctTypes: number;
  byType: Array<{
    type: MovementType;
    label: string;
    count: number;
    totalQuantity: number;
  }>;
};
```

Add after `calculateInventoryStocks` (around line 481):

```ts
const MOVEMENT_TYPE_ORDER: MovementType[] = [
  'EXIT',
  'PURCHASE',
  'RETURN',
  'WRITEOFF',
  'STOCK_ADJUSTMENT_IN',
  'STOCK_ADJUSTMENT_OUT',
  'EXCEL_IMPORT',
];

export const calculateMovementAggregates = (
  movements: ReportMovement[],
): MovementAggregate => {
  const byTypeMap = new Map<MovementType, { count: number; totalQuantity: number }>();
  let totalItemsMoved = 0;

  for (const entry of movements) {
    const type = normalizeMovementType(entry.movement.type);
    if (!type) continue;

    const quantity = entry.details.reduce((s, d) => s + d.quantity, 0);
    totalItemsMoved += quantity;

    const current = byTypeMap.get(type) ?? { count: 0, totalQuantity: 0 };
    current.count += 1;
    current.totalQuantity += quantity;
    byTypeMap.set(type, current);
  }

  const byType = MOVEMENT_TYPE_ORDER
    .filter((type) => byTypeMap.has(type))
    .map((type) => {
      const data = byTypeMap.get(type)!;
      return {
        type,
        label: movementTypeLabel(type),
        count: data.count,
        totalQuantity: data.totalQuantity,
      };
    });

  return {
    totalMovements: movements.length,
    totalItemsMoved,
    distinctTypes: byType.length,
    byType,
  };
};
```

- [ ] **Step 2: Add drawMovementAggregates helper**

Add after `drawStockSummary` (around line 673):

```ts
export const drawMovementAggregates = (
  writer: ReturnType<typeof createPagedWriter>,
  font: PDFFont,
  boldFont: PDFFont,
  aggregates: MovementAggregate,
) => {
  writer.ensureSpace(90);
  writer.drawText('Resumen de movimientos', {
    x: MARGIN,
    size: 14,
    font: boldFont,
  });
  writer.moveDown(20);

  // Row 1: three summary cards
  const summaryBoxes = [
    { label: 'TOTAL MOVIMIENTOS', value: String(aggregates.totalMovements) },
    { label: 'TOTAL ITEMS MOVIDOS', value: formatStock(aggregates.totalItemsMoved) },
    { label: 'TIPOS DE MOVIMIENTO', value: String(aggregates.distinctTypes) },
  ];

  const boxWidth = (PAGE_WIDTH - MARGIN * 2 - 16) / 3;
  summaryBoxes.forEach((box, index) => {
    const x = MARGIN + index * (boxWidth + 8);
    const boxHeight = 52;
    const baseY = writer.getY();

    writer.drawRectangle({
      x,
      y: baseY - boxHeight,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.96, 0.96, 0.96),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1,
    });

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

  // Row 2: per-type cards (up to 4 per row)
  if (aggregates.byType.length > 0) {
    writer.ensureSpace(24);
    writer.drawText('Desglose por tipo', {
      x: MARGIN,
      size: 12,
      font: boldFont,
      color: rgb(0.25, 0.25, 0.25),
    });
    writer.moveDown(18);

    const typeBoxWidth = (PAGE_WIDTH - MARGIN * 2 - 24) / 4;
    const typeBoxHeight = 48;

    aggregates.byType.forEach((typeAgg, index) => {
      const col = index % 4;
      if (col === 0 && index > 0) {
        writer.moveDown(typeBoxHeight + 10);
      }

      const x = MARGIN + col * (typeBoxWidth + 8);
      const baseY = writer.getY();

      writer.drawRectangle({
        x,
        y: baseY - typeBoxHeight,
        width: typeBoxWidth,
        height: typeBoxHeight,
        color: rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.88, 0.88, 0.88),
        borderWidth: 1,
      });

      writer.setY(baseY - 14);
      writer.drawText(typeAgg.label.toUpperCase(), {
        x: x + 8,
        size: 8,
        font: boldFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      writer.setY(baseY - 32);
      writer.drawText(`${typeAgg.count} movs · ${formatStock(typeAgg.totalQuantity)} unid`, {
        x: x + 8,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      writer.setY(baseY);
    });

    // Move past the last row
    writer.moveDown(typeBoxHeight + 10);
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add packages/database/supabase/functions/_shared/pdf-report-utils.ts
git commit -m "feat(reports): add movement aggregate calculation and drawing"
```

---

## Task 4: Add buildReportEmailHtml Helper

**Files:**
- Modify: `packages/database/supabase/functions/_shared/pdf-report-utils.ts`

- [ ] **Step 1: Add buildReportEmailHtml function at the end of the file**

```ts
export const buildReportEmailHtml = (options: {
  name: string | null;
  hasMovement: boolean;
  hasInventory: boolean;
  periodStart?: string;
  periodEnd?: string;
  generatedAt: string;
}): string => {
  const periodSection = options.periodStart && options.periodEnd
    ? `correspondientes al periodo <strong>${options.periodStart} → ${options.periodEnd}</strong>`
    : '';

  const movementCard = options.hasMovement
    ? `<tr>
      <td style="border:1px solid #e0e0e0; border-radius:6px; padding:16px; margin-bottom:12px;">
        <p style="margin:0; font-size:14px; font-weight:bold; color:#1a1a1a;">Reporte de Movimientos</p>
        <p style="margin:4px 0 0; font-size:12px; color:#777;">Resumen semanal de salidas, compras, devoluciones y ajustes de stock.</p>
      </td>
    </tr>`
    : '';

  const inventoryCard = options.hasInventory
    ? `<tr>
      <td style="border:1px solid #e0e0e0; border-radius:6px; padding:16px; margin-bottom:12px;">
        <p style="margin:0; font-size:14px; font-weight:bold; color:#1a1a1a;">Reporte de Inventario</p>
        <p style="margin:4px 0 0; font-size:12px; color:#777;">Estado actual del inventario con totales por almacén y obra.</p>
      </td>
    </tr>`
    : '';

  const emptyCard = !options.hasMovement && !options.hasInventory
    ? `<tr>
      <td style="border:1px solid #e0e0e0; border-radius:6px; padding:16px;">
        <p style="margin:0; font-size:14px; color:#777;">No hay reportes disponibles para este periodo.</p>
      </td>
    </tr>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;">
    <tr>
      <td align="center" style="padding:24px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="background:#1a1a1a; padding:24px 32px;">
              <span style="color:#ffffff; font-size:18px; font-weight:bold; letter-spacing:1px;">INGEXPERT</span>
              <span style="color:#aaaaaa; font-size:12px; margin-left:12px;">Reportes Semanales</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px; font-size:16px; color:#333;">Hola ${options.name || 'Administrador'},</p>
              <p style="margin:0 0 24px; font-size:14px; color:#555; line-height:1.5;">
                Adjunto encontrarás los reportes semanales de Ingexpert ${periodSection}.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${movementCard}
                ${inventoryCard}
                ${emptyCard}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa; padding:16px 32px; border-top:1px solid #eee;">
              <p style="margin:0; font-size:12px; color:#999;">Equipo Ingexpert · ${options.generatedAt}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/database/supabase/functions/_shared/pdf-report-utils.ts
git commit -m "feat(reports): add professional inline-CSS email HTML builder"
```

---

## Task 5: Update Movement Report

**Files:**
- Modify: `packages/database/supabase/functions/movement-report/index.ts`

- [ ] **Step 1: Update imports**

Replace the import block with:

```ts
import { rgb } from 'npm:pdf-lib@1.17.1';
import {
  DEFAULT_TIME_ZONE,
  MARGIN,
  PAGE_WIDTH,
  SECTION_GAP,
  buildReportMovements,
  calculateMovementAggregates,
  corsHeaders,
  createAdminClient,
  createPagedWriter,
  drawCard,
  drawMovementAggregates,
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
```

- [ ] **Step 2: Replace the PDF generation block**

Replace lines 90-186 (from `const { pdfDoc, font, boldFont } = await startPdfDocument();` to the end of the movement card loop) with:

```ts
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

    // Use movement aggregates instead of stock summary
    const aggregates = calculateMovementAggregates(reportMovements);
    drawMovementAggregates(writer, font, boldFont, aggregates);

    writer.drawText('Movimientos del periodo', {
      x: MARGIN,
      size: 14,
      font: boldFont,
    });
    writer.moveDown(20);

    if (reportMovements.length === 0) {
      drawCard(writer, [
        { text: 'No se encontraron movimientos dentro del rango sabado 12:00 pm -> sabado 12:00 pm.', font, size: 11, color: rgb(0.35, 0.35, 0.35) },
      ]);
    } else {
      for (const entry of reportMovements) {
        const movementType = normalizeMovementType(entry.movement.type);
        const headerText = `${formatDateTime(new Date(entry.movement.date), DEFAULT_TIME_ZONE)} | ${movementTypeLabel(movementType)}`;
        const projectText = `Proyecto: ${entry.projectName} | Destino: ${escapePdfText(entry.movement.destination) || 'Sin destino'}`;
        const metaText = `Creado por: ${entry.creatorName} | Entrega: ${entry.deliveryName} | Recibe: ${entry.receiptName}`;
        const observationText = `Observaciones: ${escapePdfText(entry.movement.observations) || 'Sin observaciones'}`;

        const detailLines = entry.details.length > 0
          ? entry.details.map((detail) => `- [${detail.itemCode}] ${detail.itemName}: ${formatStock(detail.quantity)} ${detail.unit}`)
          : ['- Sin detalles'];

        const wrappedObservation = splitText(observationText, PAGE_WIDTH - MARGIN * 2 - 20, font, 10);
        const wrappedDetailLines = detailLines.flatMap((line) =>
          splitText(line, PAGE_WIDTH - MARGIN * 2 - 28, font, 10),
        );

        const cardLines: Array<{ text: string; font: PDFFont; size: number; color?: ReturnType<typeof rgb> }> = [
          { text: headerText, font: boldFont, size: 11 },
          { text: projectText, font: boldFont, size: 10 },
          { text: metaText, font, size: 10, color: rgb(0.25, 0.25, 0.25) },
          ...wrappedObservation.map((t) => ({ text: t, font, size: 10, color: rgb(0.25, 0.25, 0.25) })),
          ...wrappedDetailLines.map((t) => ({ text: t, font, size: 10 })),
        ];

        drawCard(writer, cardLines, { padding: 10, gap: 10 });
      }
    }

    writer.finalizeDocument(new Date(), DEFAULT_TIME_ZONE);
```

- [ ] **Step 3: Commit**

```bash
git add packages/database/supabase/functions/movement-report/index.ts
git commit -m "feat(reports): movement report uses aggregates, drawCard, and page manager"
```

---

## Task 6: Update Inventory Report

**Files:**
- Modify: `packages/database/supabase/functions/inventory-report/index.ts`

- [ ] **Step 1: Update imports**

Replace the import block with:

```ts
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
  drawCard,
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
```

- [ ] **Step 2: Replace the PDF generation block**

Replace lines 52-113 (from `const { pdfDoc, font, boldFont } = await startPdfDocument();` to the end of the inventory card loop) with:

```ts
    const { pdfDoc, font, boldFont } = await startPdfDocument();
    const writer = createPagedWriter(pdfDoc, font, boldFont, 'Reporte General de Inventario');

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
      drawCard(writer, [
        { text: 'No se encontraron datos de inventario en el ledger de movimientos.', font, size: 11, color: rgb(0.35, 0.35, 0.35) },
      ]);
    } else {
      for (const row of inventoryRows) {
        const header = `[${row.code}] ${row.name}`;
        const stockLine = `Total: ${formatStock(row.total)} ${row.unit} | Almacen: ${formatStock(row.warehouse)} ${row.unit} | Obra: ${formatStock(row.onsite)} ${row.unit}`;
        const wrappedHeader = splitText(header, PAGE_WIDTH - MARGIN * 2 - 20, boldFont, 11);
        const wrappedStock = splitText(stockLine, PAGE_WIDTH - MARGIN * 2 - 20, font, 10);

        const cardLines: Array<{ text: string; font: PDFFont; size: number; color?: ReturnType<typeof rgb> }> = [
          ...wrappedHeader.map((t) => ({ text: t, font: boldFont, size: 11 })),
          ...wrappedStock.map((t) => ({ text: t, font, size: 10, color: rgb(0.25, 0.25, 0.25) })),
        ];

        drawCard(writer, cardLines, { padding: 10, gap: 10 });
      }
    }

    writer.finalizeDocument(generatedAt, DEFAULT_TIME_ZONE);
```

- [ ] **Step 3: Commit**

```bash
git add packages/database/supabase/functions/inventory-report/index.ts
git commit -m "feat(reports): inventory report uses drawCard and page manager"
```

---

## Task 7: Update Weekly Report Emailer

**Files:**
- Modify: `packages/database/supabase/functions/weekly-report-emailer/index.ts`

- [ ] **Step 1: Update imports**

Replace the import block with:

```ts
import {
  buildReportEmailHtml,
  corsHeaders,
  createAdminClient,
  formatDateTime,
  isAuthorized,
  json,
} from '../_shared/pdf-report-utils.ts';
```

- [ ] **Step 2: Replace the htmlBody construction in sendReportEmail**

Replace lines 91-98 (the `htmlBody` assignment) with:

```ts
    const htmlBody = buildReportEmailHtml({
      name: options.name,
      hasMovement,
      hasInventory,
      generatedAt: formatDateTime(new Date(), 'America/La_Paz'),
    });
```

- [ ] **Step 3: Commit**

```bash
git add packages/database/supabase/functions/weekly-report-emailer/index.ts
git commit -m "feat(reports): weekly email uses professional HTML template"
```

---

## Task 8: Fix drawStockSummary for New Page Manager

**Files:**
- Modify: `packages/database/supabase/functions/_shared/pdf-report-utils.ts`

The `drawStockSummary` function currently does `writer.ensureSpace(90)` and then draws boxes. It also uses `writer.setY` directly. We need to make sure it works with the new `CONTENT_TOP` and doesn't draw into the header zone.

Looking at the current implementation (lines ~623-673), it already uses `writer.ensureSpace`, `writer.drawText`, `writer.drawRectangle`, `writer.getY`, `writer.setY`, and `writer.moveDown` — all of which are supported by the new `createPagedWriter`. No changes should be needed unless the box positioning math conflicts with the new content area.

However, the stock boxes currently draw at `y: writer.getY() - 52` and then `writer.setY(baseY)` is used to reset. This pattern should still work because `getY` and `setY` operate on the same `y` cursor.

- [ ] **Step 1: Verify drawStockSummary still compiles**

Run a typecheck if available, or visually inspect the function to confirm all called methods exist on the new return type.

The new `createPagedWriter` return type includes:
- `ensureSpace`
- `drawLines`
- `drawRectangle`
- `drawText`
- `moveDown`
- `getY`
- `setY`
- `finalizeDocument`

`drawStockSummary` only uses `ensureSpace`, `drawText`, `drawRectangle`, `moveDown`, `getY`, `setY`. All present. No code changes needed.

- [ ] **Step 2: Commit (or skip if no changes)**

If no changes were needed, skip this commit.

---

## Task 9: Final Verification

**Files:**
- All modified files

- [ ] **Step 1: Type-check all modified files**

If the project has a typecheck command:

```bash
cd packages/database && deno check supabase/functions/_shared/pdf-report-utils.ts supabase/functions/movement-report/index.ts supabase/functions/inventory-report/index.ts supabase/functions/weekly-report-emailer/index.ts
```

If no `deno check` is configured, at least verify there are no obvious syntax errors by scanning the files.

- [ ] **Step 2: Review for missing exports**

Check that all newly added exports are actually exported:
- `createPagedWriter` (already exported)
- `drawCard` (must be exported)
- `calculateMovementAggregates` (must be exported)
- `drawMovementAggregates` (must be exported)
- `buildReportEmailHtml` (must be exported)

Verify each has the `export` keyword.

- [ ] **Step 3: Final commit if any fixes**

```bash
git add -A
git commit -m "fix(reports): typecheck and export fixes" || echo "No changes to commit"
```

---

## Spec Coverage Check

| Spec Requirement | Implementing Task |
|------------------|-------------------|
| Fix card overflow bug | Task 2 (drawCard) + Tasks 5 & 6 (usage) |
| Add Ingexpert header to every page | Task 1 (createPagedWriter header) |
| Add page-number footer to every page | Task 1 (finalizeDocument) |
| Replace movement stock summary with aggregates | Task 3 (calculateMovementAggregates) + Task 5 (drawMovementAggregates) |
| Keep inventory stock summary | Task 6 (no change to top section) |
| Keep item-level detail in movement cards | Task 5 (drawCard still includes detail lines) |
| Upgrade email to professional HTML | Task 4 (buildReportEmailHtml) + Task 7 (usage) |
| Do not modify email sending logic | Verified — only htmlBody string changed |

---

## Placeholder Scan

No placeholders found. All steps contain exact file paths, exact code, and exact commands.

---

## Type Consistency Check

- `createPagedWriter` signature updated to accept `(pdfDoc, font, boldFont, reportTitle)` — consistent in Tasks 5 and 6
- `drawCard` accepts `ReturnType<typeof createPagedWriter>` — consistent
- `MovementAggregate` type used by `calculateMovementAggregates` and `drawMovementAggregates` — consistent
- `buildReportEmailHtml` options shape used in Task 7 — consistent
