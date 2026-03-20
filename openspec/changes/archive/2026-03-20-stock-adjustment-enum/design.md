## Context

The current stock adjustment implementation uses a workaround: when users edit stock from the inventory section, the system creates movements with type `PURCHASE` or `WRITEOFF` and sets `destination` to the magic string `__stock_adjustment__`. This identifier is then used to:

1. Filter these movements out of the movements list view
2. Display them as "Ajuste positivo" / "Ajuste negativo" in the inventory view
3. Mark them as system-generated rather than user-created movements

With the migration to ledger-based stock calculation (stock is computed from movements, not stored), having proper enum types for adjustments is cleaner and more maintainable.

## Goals / Non-Goals

**Goals:**

- Add `STOCK_ADJUSTMENT_IN` and `STOCK_ADJUSTMENT_OUT` as proper enum values
- Make adjustment movements visible in movements list with proper type badges
- Remove the `__stock_adjustment__` magic string from all codepaths
- Migrate existing adjustment movements to new types

**Non-Goals:**

- Changing how adjustments are created (still inventory-only, not from movements CRUD)
- Modifying the stock calculation logic (ledger remains the same)
- Changing the user flow for editing inventory stock

## Decisions

### 1. Enum naming convention

**Decision:** Use `STOCK_ADJUSTMENT_IN` and `STOCK_ADJUSTMENT_OUT` (not `POSITIVE`/`NEGATIVE`)

**Rationale:**

- Consistent with existing `PURCHASE` (in) and `EXIT` (out) naming pattern
- `IN`/`OUT` clearly indicates direction in ledger context
- Avoids confusion with positive/negative stock values

**Alternatives considered:**

- `STOCK_ADJUSTMENT_POSITIVE`/`NEGATIVE` - less aligned with existing naming
- Single `STOCK_ADJUSTMENT` with quantity sign - would require schema changes

### 2. Database migration strategy

**Decision:** Two-phase approach:

1. Add new enum values (non-breaking)
2. Update existing rows: `type = CASE WHEN destination = '__stock_adjustment__' AND type = 'PURCHASE' THEN 'STOCK_ADJUSTMENT_IN' WHEN destination = '__stock_adjustment__' AND type = 'WRITEOFF' THEN 'STOCK_ADJUSTMENT_OUT' ELSE type END`, then clear `destination` for those rows
3. No rollback needed - old enum values remain valid

**Rationale:**

- Incremental migration allows rollback at each step
- Keeping old enum values ensures no data loss

### 3. Movement creation flow

**Decision:** Adjustments continue using local SQLite insert (PowerSync pattern) with new type values

**Rationale:**

- Consistent with existing offline-first architecture
- No changes to sync behavior needed
- Type validation handled by Prisma/Zod enum

### 4. Movement visibility in list

**Decision:** Remove the `destination <> '__stock_adjustment__'` filter entirely

**Rationale:**

- With proper types, adjustments are legitimate movements
- Users benefit from seeing full adjustment history
- Type badges provide clear visual distinction

## Risks / Trade-offs

| Risk                                        | Mitigation                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Existing data migration fails               | Migration runs in transaction; verify row counts before/after                                                        |
| PowerSync offline clients with cached data  | Legacy mapping for `ajuste_positivo`/`ajuste_negativo` already handles type conversion; remove magic string handling |
| Users confused by seeing "system" movements | Clear type labels ("Ajuste de stock (entrada)" / "Ajuste de stock (salida)"); distinct badge styling                 |

## Migration Plan

1. **Phase 1 - Schema update:**
   - Add `STOCK_ADJUSTMENT_IN`, `STOCK_ADJUSTMENT_OUT` to Prisma enum
   - Run `prisma migrate dev` to update database enum

2. **Phase 2 - Data migration:**
   - Create migration script to update existing rows
   - Update `destination` to `null` for adjustment movements
   - Verify migrated data integrity

3. **Phase 3 - Code updates:**
   - Update PowerSync connector to use new types
   - Update inventory form to create movements with new types
   - Remove `__stock_adjustment__` filter from movements query
   - Update movement type badge displays

4. **Phase 4 - Cleanup:**
   - Remove all `__stock_adjustment__` constants from codebase
   - Remove legacy adjustment type handling in connector
