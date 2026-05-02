# Report PDF & Email Improvements Design

**Date:** 2026-05-02
**Scope:** `packages/database/supabase/functions/` — `movement-report`, `inventory-report`, `weekly-report-emailer`
**Constraint:** Do NOT modify email sending logic, transport, or attachment handling. Only improve PDF rendering and email body formatting.

---

## 1. Problem Statement

The current weekly report PDFs and email are functional but look generic and have rendering bugs:

1. **Card overflow bug:** Per-item and per-movement card rectangles are positioned so text starts on the rectangle's bottom edge and draws upward, causing the first line to clip outside the box.
2. **No branding:** PDFs have no Ingexpert header, page numbers, or footer.
3. **Movement report shows stock summary:** The top of the movement report displays current global stock (TOTAL / EN ALMACÉN / EN OBRA) which is irrelevant for a weekly movements report. It should show movement aggregates.
4. **Email is plain:** The HTML email is a bare `<ul>` with no styling or branding.

---

## 2. Goals

1. Fix the card overflow bug in both PDF reports.
2. Add an Ingexpert-branded header and page-number footer to every PDF page.
3. Replace the stock summary in the movement report with per-movement-type aggregates.
4. Upgrade the weekly report email HTML to a professional inline-CSS layout with branding.
5. Keep all existing data density (user likes lots of data).

---

## 3. Non-Goals

- Do NOT change inventory report data layout (keep per-item cards, not tables).
- Do NOT remove item-level detail from movement cards.
- Do NOT change email transport logic, attachment encoding, or cron scheduling.
- Do NOT add images/logos to PDFs (text-only branding to avoid external asset dependencies in Supabase Edge Functions).

---

## 4. Design

### 4.1 PDF Page Manager Refactor

Upgrade `createPagedWriter` in `pdf-report-utils.ts` into a proper page manager.

#### 4.1.1 Page Zones

```
+------------------------------------------+
|  [Header: 60px]                          |
|  INGEXPERT  ·  Reporte Semanal...        |
|  ─────────────────────────────────────   |
+------------------------------------------+
|                                          |
|  [Content: auto]                         |
|                                          |
+------------------------------------------+
|  [Footer: 30px]                          |
|  Generado: 02/05/2026 14:30    Pág 1/3   |
+------------------------------------------+
```

- **Header zone height:** `60`
- **Footer zone height:** `30`
- **Content start Y:** `PAGE_HEIGHT - MARGIN - 60`
- **Content end Y:** `MARGIN + 30`
- **Usable content height:** `PAGE_HEIGHT - MARGIN * 2 - 90`

#### 4.1.2 Header Content

Drawn on every page including page 1:

- Left: `INGEXPERT` in bold, 14px, dark gray (`rgb(0.1, 0.1, 0.1)`)
- Right: Report title (e.g., "Reporte Semanal de Movimientos" or "Reporte General de Inventario") in 10px, medium gray
- Below: A 1px horizontal line separator at `y = headerBottom + 8`

#### 4.1.3 Footer Content

Drawn on every page. Implemented in two phases:

1. **During writing:** Each page gets a placeholder or is left blank in the footer zone.
2. **After `finalizeDocument()`:** Iterate all pages, draw:
   - Left: `Generado: <dateTime>` in 8px, light gray
   - Right: `Página N / M` in 8px, light gray

Because `pdf-lib` does not support reading back existing page content for precise re-layout, the footer is drawn at document-finalization time by iterating all pages and drawing at a fixed Y coordinate (`MARGIN + 12`). The content writer must never draw into the footer zone; `ensureSpace` must check against `MARGIN + 30`.

#### 4.1.4 `ensureSpace` Behavior

```ts
const CONTENT_BOTTOM = MARGIN + 30;

const ensureSpace = (requiredHeight: number) => {
  if (y - requiredHeight < CONTENT_BOTTOM) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN - 60; // start below header
    drawHeader(page, pageNumberPlaceholder);
  }
};
```

On initial `createPagedWriter` creation, the first page must also have its header drawn immediately so page 1 is branded.

#### 4.1.5 Reusable `drawCard` Helper

```ts
type CardLine = {
  text: string;
  font: PDFFont;
  size: number;
  color?: ReturnType<typeof rgb>;
};

function drawCard(
  writer: PagedWriter,
  lines: CardLine[],
  options: {
    padding?: number;
    gap?: number;
    backgroundColor?: ReturnType<typeof rgb>;
    borderColor?: ReturnType<typeof rgb>;
  },
): void;
```

Algorithm:
1. Calculate total text height: `sum(line.font.heightAtSize(line.size))` (approximate via `size * 1.2`).
2. `cardHeight = textHeight + padding * 2`
3. `writer.ensureSpace(cardHeight + gap)`
4. Draw rectangle with bottom-left at `y - cardHeight` and height `cardHeight`
5. Draw first line baseline at `y - padding`, subsequent lines spaced by `lineHeight` below
6. Advance writer Y by `cardHeight + gap`

This ensures text is fully inside the rectangle with consistent padding on all sides. The rectangle top aligns with the pre-draw cursor `y`, so no text draws above the card.

---

### 4.2 Movement Report Changes

#### 4.2.1 Aggregate Calculation

Add `calculateMovementAggregates` to `pdf-report-utils.ts`:

```ts
type MovementAggregate = {
  totalMovements: number;
  byType: Array<{
    type: MovementType;
    label: string;
    count: number;
    totalQuantity: number;
  }>;
};

function calculateMovementAggregates(
  movements: ReportMovement[],
): MovementAggregate;
```

Logic:
- `totalMovements = movements.length`
- Group by `normalizeMovementType(movement.type)`
- For each type, count movements and sum `details.reduce((s, d) => s + d.quantity, 0)`
- Return sorted by a fixed type order: EXIT, PURCHASE, RETURN, WRITEOFF, STOCK_ADJUSTMENT_IN, STOCK_ADJUSTMENT_OUT, EXCEL_IMPORT

#### 4.2.2 Top Section Layout

Replace `drawStockSummary(writer, boldFont, stockSummary)` with `drawMovementAggregates(writer, boldFont, aggregates)`.

Layout:
- Title: "Resumen de movimientos" (14px bold)
- Card row 1 (3 cards):
  - "TOTAL MOVIMIENTOS" → count
  - "TOTAL ITEMS MOVIDOS" → sum of all detail quantities
  - "TIPOS DE MOVIMIENTO" → count of distinct types present
- Card row 2 (dynamic, up to 4 cards per row):
  - One card per type present: label + count + total quantity
  - Example: "SALIDAS" → "12 movs · 450.00 unid"

Use the new `drawCard` helper for all cards.

#### 4.2.3 Body Section

Keep existing movement card loop. Replace manual rectangle + text drawing with `drawCard`.

Each movement card contains:
- Header lines: date, type, project, destination (bold)
- Meta lines: creator, delivery, receipt
- Observation line
- Detail lines (item-level quantities kept)

---

### 4.3 Inventory Report Changes

#### 4.3.1 Top Section

Keep existing `drawStockSummary` (TOTAL / EN ALMACÉN / EN OBRA).

#### 4.3.2 Body Section

Keep existing per-item card loop. Replace manual rectangle + text drawing with `drawCard`.

Each inventory card contains:
- Header: `[CODE] Name` (bold)
- Stock line: `Total: X unit | Almacen: Y unit | Obra: Z unit`

---

### 4.4 Email Format Changes

In `weekly-report-emailer/index.ts`, replace the inline `htmlBody` string with a shared helper.

#### 4.4.1 Shared Helper

Add to `pdf-report-utils.ts` (or a new `email-utils.ts` in `_shared`):

```ts
function buildReportEmailHtml(options: {
  name: string | null;
  hasMovement: boolean;
  hasInventory: boolean;
  periodStart?: Date;
  periodEnd?: Date;
}): string;
```

#### 4.4.2 HTML Structure

```html
<!DOCTYPE html>
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
          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a; padding:24px 32px;">
              <span style="color:#ffffff; font-size:18px; font-weight:bold; letter-spacing:1px;">INGEXPERT</span>
              <span style="color:#aaaaaa; font-size:12px; margin-left:12px;">Reportes Semanales</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px; font-size:16px; color:#333;">Hola {{name}},</p>
              <p style="margin:0 0 24px; font-size:14px; color:#555; line-height:1.5;">
                Adjunto encontrarás los reportes semanales de Ingexpert
                {{#period}}correspondientes al periodo <strong>{{periodStart}} → {{periodEnd}}</strong>{{/period}}.
              </p>
              <!-- Attachment cards -->
              <table width="100%" cellpadding="0" cellspacing="0">
                {{#hasMovement}}
                <tr>
                  <td style="border:1px solid #e0e0e0; border-radius:6px; padding:16px; margin-bottom:12px;">
                    <p style="margin:0; font-size:14px; font-weight:bold; color:#1a1a1a;">Reporte de Movimientos</p>
                    <p style="margin:4px 0 0; font-size:12px; color:#777;">Resumen semanal de salidas, compras, devoluciones y ajustes de stock.</p>
                  </td>
                </tr>
                {{/hasMovement}}
                {{#hasInventory}}
                <tr>
                  <td style="border:1px solid #e0e0e0; border-radius:6px; padding:16px; margin-bottom:12px;">
                    <p style="margin:0; font-size:14px; font-weight:bold; color:#1a1a1a;">Reporte de Inventario</p>
                    <p style="margin:4px 0 0; font-size:12px; color:#777;">Estado actual del inventario con totales por almacén y obra.</p>
                  </td>
                </tr>
                {{/hasInventory}}
                {{^hasMovement}}{{^hasInventory}}
                <tr>
                  <td style="border:1px solid #e0e0e0; border-radius:6px; padding:16px;">
                    <p style="margin:0; font-size:14px; color:#777;">No hay reportes disponibles para este periodo.</p>
                  </td>
                </tr>
                {{/hasInventory}}{{/hasMovement}}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#fafafa; padding:16px 32px; border-top:1px solid #eee;">
              <p style="margin:0; font-size:12px; color:#999;">Equipo Ingexpert · {{generatedAt}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

Use simple string replacement (not a templating engine) since Deno has no external deps.

---

## 5. Implementation Order

1. **Refactor `createPagedWriter`** — add header/footer zones, auto-draw on new pages, add `finalizeDocument`
2. **Add `drawCard` helper** — fix overflow bug
3. **Add `calculateMovementAggregates`** and `drawMovementAggregates` helpers
4. **Update `movement-report`** — swap top section, use `drawCard` for body
5. **Update `inventory-report`** — use `drawCard` for body
6. **Add `buildReportEmailHtml`** and update `weekly-report-emailer`
7. **Test** — run local Deno tests if available; inspect generated PDFs for header/footer/card alignment

---

## 6. Testing Plan

- Verify header appears on page 1 and all continuation pages
- Verify footer shows correct page numbers on all pages
- Verify no text clips outside card rectangles in either report
- Verify movement report top section shows type aggregates, not stock summary
- Verify inventory report top section still shows stock summary
- Verify email HTML renders correctly in common clients (Gmail, Outlook web)
- Verify plain text fallback is still sent alongside HTML

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Header/footer logic introduces off-by-one page break bugs | Extensively test with large datasets that force multiple pages |
| `drawCard` padding changes visual density | Start with `padding: 10`, adjust if cards feel too tall |
| Email HTML gets caught in spam filters | Keep all CSS inline; no external images; maintain plain text fallback |
| Deno environment lacks `Intl.DateTimeFormat` support for timezone | Already used in existing code; no new risk |
