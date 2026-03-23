## Why

The MVP has 5 minor UI/UX issues that reduce data clarity and usability: kit rows show zeros instead of placeholder dashes in non-stock columns, movement exports lack the movement ID column needed for audit trails, the export button is visible to non-admin users in movements (unlike inventory), date filters may exclude valid records due to timezone handling, and row selection checkboxes are visible to non-admin users.

## What Changes

1. **Kit row display**: Update inventory table to show em-dash placeholders (—, like other non-stock columns) instead of zeros for kit rows in warehouse/onsite/total inventory columns
2. **Movement export**: Add MOVIMIENTO_ID column to the Movimientos sheet in Excel exports
3. **Export button visibility**: Restrict movement export button to admin users only (USER role cannot see it)
4. **Date filter timezone**: Convert date filter bounds to UTC before querying Supabase, matching how dates are displayed in the UI
5. **Selection checkboxes visibility**: Hide row selection checkboxes from users with USER role in both inventory and movements tables (matching admin-only pattern already used in inventory toolbar)

## Capabilities

### New Capabilities

- `movement-export-id`: Adds movement ID column to movement Excel exports for traceability

### Modified Capabilities

- `inventory-display`: Update kit row rendering to use em-dash placeholders instead of zeros in inventory count columns; hide selection checkboxes from non-admin users
- `movement-filtering`: Fix date range filter to use UTC-aware bounds, matching Supabase storage and UI display behavior
- `movement-export`: Restrict export button visibility to admin users only, consistent with inventory export; hide selection checkboxes from non-admin users

## Impact

- **apps/frontend**: Modifies `inventory-table.columns.tsx`, `movement-table-toolbar.tsx`, `movement-table.columns.tsx`, and `dates.ts`
- **No API changes**: All fixes are frontend-only
- **No database schema changes**: Query logic updated but data model unchanged
