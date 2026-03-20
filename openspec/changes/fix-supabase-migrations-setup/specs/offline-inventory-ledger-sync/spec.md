## ADDED Requirements

### Requirement: Item model SHALL include stock field for trigger reconciliation

The Prisma `Item` model MUST include a `stock` field with `Decimal` type to align with the PostgreSQL `items.stock` column that is updated by the `movement_details` trigger.

#### Scenario: Prisma schema includes stock field

- **WHEN** the Prisma schema is generated or introspected
- **THEN** the `Item` model MUST include `stock Decimal @default(0) @map("stock") @db.Decimal(10, 2)`
- **THEN** Prisma Client MUST expose `stock` on Item type for read operations

#### Scenario: Stock field allows trigger reconciliation writes

- **WHEN** the `movement_details` trigger executes `UPDATE items SET stock = stock + delta`
- **THEN** the operation MUST succeed without constraint violations
- **THEN** the Prisma Client MUST reflect the updated stock value on subsequent reads
