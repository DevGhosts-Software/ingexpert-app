## Context

The MVP has 5 frontend-only UI/UX issues across inventory and movements features:

1. **Kit row display**: When rendering kit rows in the inventory table, warehouse/onsite/total inventory columns show `0` instead of the em-dash (—) placeholder used elsewhere for non-applicable data
2. **Movement export ID**: Movement Excel exports lack the movement ID column needed for audit traceability
3. **Export button visibility**: Movement toolbar shows the export button to all users, unlike inventory which hides it from non-admin users
4. **Date filter timezone**: Date range filters use local date strings directly, but Supabase stores dates in UTC. The filter logic may exclude records from the selected day when converting between timezones
5. **Selection checkbox visibility**: Row selection checkboxes are visible to all users in the movements table, while inventory correctly hides them for non-admin users

## Goals / Non-Goals

**Goals:**

- Fix kit rows to display em-dash placeholders consistently with other non-stock columns
- Add MOVIMIENTO_ID column to movement Excel exports
- Restrict movement export button to admin users only
- Fix date filter to properly handle UTC conversion, matching UI display behavior
- Hide row selection checkboxes from non-admin users in movements table, matching inventory behavior

**Non-Goals:**

- No API changes or database schema modifications
- No new backend logic — all fixes are frontend rendering/query logic only

## Decisions

### 1. Kit Row Display Fix

**Decision**: Update `inventory-table.columns.tsx` to check `row.original.type === 'KIT'` for warehouse, onsite, and total inventory columns, returning the em-dash placeholder instead of the raw value.

**Rationale**: This matches existing behavior in the `location` and `unit` columns which already show em-dash for kit rows. The inventory counts are not meaningful for kits since components are tracked individually.

**Alternatives considered**:

- Showing actual summed component quantities: Not appropriate since kit stock is derived from components, not stored independently

### 2. Movement Export ID Column

**Decision**: Add `MOVIMIENTO_ID: movement.id` to the `movementRows` mapping in `movement-table-toolbar.tsx`.

**Rationale**: The `detailRows` already export `MOVIMIENTO_ID` from `detail.movementId`. The `movementRows` should include the movement ID for full traceability, matching the detail sheet pattern.

### 3. Export Button Admin Restriction

**Decision**: Wrap the export button in `movement-table-toolbar.tsx` with `{isAdmin && (...)}`, matching the pattern used in `inventory-table-toolbar.tsx`.

**Rationale**: The inventory toolbar already demonstrates this pattern with the import/export buttons gated behind `isAdmin`. The movements toolbar should follow the same convention.

### 4. Date Filter UTC Conversion

**Decision**: Filter client-side in `page.tsx` using `toLocaleDateString('en-CA')` to convert both movement dates and filter values to local date strings (YYYY-MM-DD format) before comparison.

**Rationale**: Since all movements are fetched from PowerSync and filtered client-side, comparing the UTC timestamp with a local date string would cause issues. By converting both to the same local date format, the comparison works correctly regardless of timezone offset. This is simpler than SQL-level UTC conversion and avoids creating unused helper functions.

**Alternatives considered**:

- Using helper functions to convert to UTC bounds: Creates unused code; the client-side approach is cleaner for this use case

## Risks / Trade-offs

| Risk                                    | Mitigation                                                             |
| --------------------------------------- | ---------------------------------------------------------------------- |
| Timezone edge cases (DST transitions)   | Using date-fns `startOfDay`/`endOfDay` with explicit timezone handling |
| Existing cached queries not invalidated | PowerSync handles this automatically on reconnect                      |

### 5. Selection Checkbox Visibility in Movements

**Decision**: Update `getColumns()` in `movement-table.columns.tsx` to accept `isAdmin` parameter and gate the selection column behind this check. Update `movement-table.tsx` to pass `isAdmin` to `getColumns()`.

**Rationale**: The inventory table already implements this pattern correctly (line 234: `isAdmin ? {...} : null`). The movements table needs the same treatment to prevent non-admin users from seeing bulk selection UI.

**Alternatives considered**:

- Passing `null` for selection column when not admin: Already the pattern used in inventory
