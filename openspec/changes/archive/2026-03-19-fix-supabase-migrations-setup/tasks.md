## 1. Prisma Schema Update

- [x] 1.1 Add `stock` field to Item model in `packages/database/prisma/schema/inventory.prisma` with `Decimal @default(0) @map("stock") @db.Decimal(10, 2)`
- [x] 1.2 Regenerate Prisma client with `pnpm --filter @ingexpert/database db:generate:dev`

## 2. Supabase Migration Files

- [x] 2.1 Rename `00_core-functions.sql` to `20240101000000_core-functions.sql` in `packages/database/supabase/migrations/`
- [x] 2.2 Rename `01_inventory-ledger-trigger.sql` to `20240101000001_inventory-ledger-trigger.sql`
- [x] 2.3 Rename `02_powersync pubilcation.sql` to `20240101000002_powersync-publication.sql` (fix typo and spaces)
- [x] 2.4 Rename `03_powersync-upload-permissions.sql` to `20240101000003_powersync-upload-permissions.sql`
- [x] 2.5 Rename `04_powersync-rls.sql` to `20240101000004_powersync-rls.sql`
- [x] 2.6 Rename `05_app-data bucket policies.sql` to `20240101000005_app-data-bucket-policies.sql` (fix spaces)

## 3. Documentation

- [x] 3.1 Update `packages/database/supabase/README.md` with correct migration filenames and note about timestamp convention

## 4. Verification

- [x] 4.1 Run `pnpm check` to verify lint, type-check, and build pass
