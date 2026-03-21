## Context

The `parseInventoryRows` function in `import-excel-dialog.tsx` currently reads only `INVENTARIO_ALMACEN` (and optionally `INVENTARIO_OBRA`) from imported Excel rows. When a user exports inventory, the file contains three columns: `INVENTARIO_ALMACEN`, `INVENTARIO_OBRA`, and `INVENTARIO_TOTAL`. The system tracks warehouse stock and site (onsite) stock separately, with total being the sum of both. Because stock calculations are driven by movement transactions, importing all three columns directly would bypass the movement ledger.

The client has decided: when an exported file is re-imported, the system should take the total inventory value and inject 100% into warehouse stock, with the client responsible for manually creating movements to balance warehouse vs site stock afterward.

## Goals / Non-Goals

**Goals:**

- Allow users to re-import files produced by the Export action without manual column editing
- Maintain backward compatibility with the Classic Import format (single-column template)
- Ensure all stock additions use the PURCHASE movement type with Excel Import observation text

**Non-Goals:**

- Changing how stock totals are calculated (movement-driven calculation remains unchanged)
- Supporting direct import of separate warehouse/site/total values from the Export format
- Modifying the Export format or its column structure

## Decisions

### Decision: Format detection by column header inspection

Detect which format the uploaded file follows by checking whether the `INVENTARIO_TOTAL` column header exists in the normalized (uppercase, no accents) header set.

**Export Format columns** (8 columns): CODIGO, NOMBRE, UBICACION, INVENTARIO_ALMACEN, INVENTARIO_OBRA, INVENTARIO_TOTAL, UNIDAD, TIPO

**Classic Import Format columns** (5 columns): CODIGO, NOMBRE, UBICACION, UNIDAD, [TIPO], INVENTARIO_ALMACEN

**Rationale**: The Export format is uniquely identified by the presence of `INVENTARIO_TOTAL` column. Normalized header keys are already used throughout the parser, so format detection integrates cleanly without introducing new infrastructure.

**Alternatives considered**:

- Adding a magic string or version marker to the Export format — rejected as it would require changing the export logic and could break existing integrations
- Asking the user to select format before import — adds friction; detection is unambiguous

### Decision: Export Format — inject total into warehouse stock

When `INVENTARIO_TOTAL` is detected, read only that column's value and map it to `warehouseInventory` in the parsed row. `onsiteInventory` is set to 0.

**Rationale**: The client explicitly requested that exported total inventory be dumped entirely into warehouse stock. Site stock will be balanced manually via movements. This keeps the import logic simple and consistent with the movement-driven stock model.

### Decision: Classic Import Format — maintain current behavior

When `INVENTARIO_TOTAL` is absent, the parser behaves exactly as before: `warehouseInventory` from `INVENTARIO_ALMACEN` (or `STOCK`/`STOCK_INICIAL` fallbacks), `onsiteInventory` from `INVENTARIO_OBRA`.

## Risks / Trade-offs

- **Risk**: Users may confuse Export Format with Classic Format for files they manually edit.  
  **Mitigation**: Detection is deterministic based on column presence. No ambiguity arises from the column header check.

- **Risk**: Re-importing an Export file injects total into warehouse, bypassing the warehouse/site split logic (specifically the EXIT movement for onsite stock in the current import).  
  **Mitigation**: This is the intended behavior per client request. The EXIT movement creation path for `onsiteInventory > 0` will still fire when `onsiteInventory` is explicitly set (Classic Format with INVENTARIO_OBRA column).

- **Risk**: No version marker means format detection could silently misinterpret a manually-crafted file that happens to include INVENTARIO_TOTAL.  
  **Mitigation**: The parser is intentionally strict: only presence of the normalized `INVENTARIO_TOTAL` header triggers Export Format behavior. A manually crafted file with this column would legitimately be interpreted as Export Format by user intent.
