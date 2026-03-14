## ADDED Requirements

### Requirement: openapi.json is the source of truth for inventory endpoint contracts

Before implementing any item or kit route, data model change, or frontend hook for inventory, agents SHALL read `openapi/openapi.json` for the exact endpoint shapes, request/response schemas, and authentication requirements defined for this domain.

#### Scenario: Agent adds a new inventory endpoint

- **WHEN** an agent is tasked with adding or modifying an item or kit procedure
- **THEN** it SHALL cross-reference `openapi/openapi.json` first and MUST match the existing response shape conventions

### Requirement: Item stock is stored as Decimal and serialized to number

The `stock` field on `Item` and `quantity` on `MovementDetail` are `Prisma.Decimal` in the database. Service mappers MUST call `.toNumber()` on these fields before returning. Frontend receives `number`, never `Prisma.Decimal`.

#### Scenario: Agent writes a service mapper for an item

- **WHEN** an agent creates or updates a `mapItem()` method in the items service
- **THEN** it SHALL include `stock: item.stock.toNumber()` — passing raw `Prisma.Decimal` over tRPC is prohibited

#### Scenario: Agent adds a new Decimal field to Item

- **WHEN** a new `Decimal` column is added to the `Item` Prisma model
- **THEN** a TypeScript compile error in `mapItem()` will surface until the mapper is updated — this is the safety mechanism and MUST NOT be suppressed with a cast

### Requirement: KIT items have restricted behavior for stock and location

Items of type `KIT` SHALL have no meaningful stock or location. They are composition containers only. KIT rows in the UI SHALL render `—` (em-dash) with `text-muted-foreground/50` for the stock, location, unit, and image cells.

#### Scenario: Agent creates a KIT item

- **WHEN** a KIT item is created via the API
- **THEN** it SHALL be seeded/created with `stock: 0` and `location: ''` — stock increment/decrement operations MUST NOT apply to KIT items directly

#### Scenario: Agent renders a KIT row in the inventory table

- **WHEN** the frontend renders a table row for a KIT item
- **THEN** it SHALL show `—` for stock, location, unit, and imageUrl fields — never show zeros or empty strings

### Requirement: Kit composition restricts component types to PRODUCT and TOOL

Only items of type `PRODUCT` or `TOOL` MAY be added as kit components. `EQUIPMENT` and `KIT` items MUST NOT appear as kit components.

#### Scenario: Agent adds a component to a kit

- **WHEN** the `SetKitComponents` procedure is called with a component item
- **THEN** the service SHALL validate that the component's `ItemType` is `PRODUCT` or `TOOL` and throw a validation error for any other type

### Requirement: Bulk item import uses pre-fetch + bulk pattern

For batch write operations (e.g., Excel import), the service SHALL use the pre-fetch + bulk pattern: one query to find all existing records by `code`, then `createMany` for new items and individual `update` (with `stock: { increment: value }`) for existing ones. A single `$transaction` wrapping many sequential operations is prohibited for large datasets (Prisma default timeout: 5 s).

#### Scenario: Agent imports items from Excel

- **WHEN** the `importMany` service method processes a batch of items
- **THEN** it SHALL match by `code` (natural identifier), use `createMany` for new items, and use `stock: { increment: value }` for existing ones — never replace the whole record

#### Scenario: Agent imports an item whose code already exists

- **WHEN** the import batch contains a code that matches an existing item
- **THEN** the existing item's stock SHALL be incremented by the imported quantity — the item name and other fields MUST NOT be overwritten

### Requirement: ItemType has a defined Excel label mapping

`ItemType` values are stored in English in the database but displayed/imported in Spanish in Excel files. The mapping is: `PRODUCT` ↔ `PRODUCTO`, `EQUIPMENT` ↔ `EQUIPO`, `TOOL` ↔ `HERRAMIENTA`, `KIT` ↔ `KIT`. The `parseItemType()` function SHALL accept both English and Spanish values; unknown values default to `PRODUCT`.

#### Scenario: Agent parses an Excel row with a Spanish type label

- **WHEN** `parseItemType('HERRAMIENTA')` is called
- **THEN** it SHALL return `ItemType.TOOL`
