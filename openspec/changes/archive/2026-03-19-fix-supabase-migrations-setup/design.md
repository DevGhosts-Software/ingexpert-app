## Context

The inventory system now calculates stock from movement ledger entries via PostgreSQL triggers (`01_inventory-ledger-trigger.sql`). The trigger updates `items.stock` on every `movement_details` INSERT/UPDATE/DELETE. However:

1. **Missing Prisma field**: The `Item` model in Prisma schema lacks the `stock` field, causing type mismatches between database schema and generated client.

2. **Supabase migration tracking**: Current migration files use numeric prefixes (`00_`, `01_`) but Supabase CLI expects timestamp-prefixed filenames (e.g., `20240319120000_`) for proper change detection. The `supabase db push` command only detects pending migrations when files follow this convention.

Current migration files:

- `00_core-functions.sql`
- `01_inventory-ledger-trigger.sql`
- `02_powersync pubilcation.sql`
- `03_powersync-upload-permissions.sql`
- `04_powersync-rls.sql`
- `05_app-data bucket policies.sql`

## Goals / Non-Goals

**Goals:**

- Align Prisma `Item` model with PostgreSQL schema by adding `stock` field
- Fix Supabase migration detection by renaming files with ISO timestamp prefixes
- Ensure future migrations follow Supabase conventions

**Non-Goals:**

- Modifying the trigger logic (already implemented)
- Changing the stock calculation approach
- Adding seed data for existing items

## Decisions

### Decision 1: Stock field definition in Prisma

**Choice:** Add `stock Decimal @default(0) @map("stock") @db.Decimal(10, 2)` to Item model

**Rationale:**

- Matches PostgreSQL `DECIMAL(10,2)` precision for quantity values
- Default of 0 ensures new items start with zero stock
- Consistent with `quantity` field in `MovementDetail` model

### Decision 2: Migration timestamp format

**Choice:** Use format `YYYYMMDDHHMMSS_description.sql` (ISO-ish, sortable)

**Rationale:**

- Supabase CLI convention uses timestamp prefixes for ordering
- Sorting by filename gives chronological application order
- Alternative (using `supabase migration new`) would reorganize existing files unnecessarily

**Timestamps to use:**

```
20240101000000_core-functions.sql
20240101000001_inventory-ledger-trigger.sql
20240101000002_powersync-publication.sql
20240101000003_powersync-upload-permissions.sql
20240101000004_powersync-rls.sql
20240101000005_app-data-bucket-policies.sql
```

Note: Fixed filename typo (`pubilcation` → `publication`) and spaces → kebab-case.

## Risks / Trade-offs

- **Risk**: Existing environments with old migration names may need re-application
  → **Mitigation**: Document that this is a one-time migration rename; production environments should use `supabase db push` after verifying local state
- **Risk**: Prisma client regeneration required after schema change
  → **Mitigation**: Use existing `pnpm db:generate` command after push
