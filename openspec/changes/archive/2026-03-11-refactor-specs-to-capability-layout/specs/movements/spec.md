## ADDED Requirements

### Requirement: openapi.json is the source of truth for movements endpoint contracts
Before implementing any movement route, ledger logic change, or frontend hook for movements, agents SHALL read `openapi/openapi.json` for the exact endpoint shapes, request/response schemas, and authentication requirements defined for this domain.

#### Scenario: Agent adds or modifies a movement endpoint
- **WHEN** an agent is tasked with any change to the movements domain
- **THEN** it SHALL read `openapi/openapi.json` first to understand the current contract before writing code

### Requirement: Movements are immutable once created
The movements ledger is **create-only**. No `update` or `delete` mutation SHALL be exposed for movement records. Stock changes applied by a movement are permanent and auditable.

#### Scenario: Agent is asked to add an edit movement feature
- **WHEN** an agent receives a request to update an existing movement
- **THEN** it SHALL reject the request as out of scope — the movements domain has no update procedure by design

### Requirement: Stock direction is enforced per MovementType
Stock changes SHALL follow the defined direction per type: `PURCHASE` and `RETURN` increment stock; `EXIT` and `WRITEOFF` decrement stock. Decrement operations MUST validate sufficient stock before committing.

#### Scenario: Agent creates a PURCHASE or RETURN movement
- **WHEN** a movement of type `PURCHASE` or `RETURN` is created
- **THEN** the service SHALL increment the stock of each referenced item inside a `$transaction`

#### Scenario: Agent creates an EXIT or WRITEOFF movement
- **WHEN** a movement of type `EXIT` or `WRITEOFF` is created
- **THEN** the service SHALL validate that each item has sufficient stock before decrementing — if any item has insufficient stock, the entire transaction MUST be rejected

### Requirement: Kit expansion validates all component stocks atomically
When a movement detail references a `KIT` item, the service SHALL expand the kit into its components and validate/adjust stock for each component individually. The expansion is all-or-nothing: if any component has insufficient stock, the entire movement transaction MUST be rejected.

#### Scenario: Agent creates a movement with a KIT item
- **WHEN** a movement detail contains an item of type `KIT`
- **THEN** the service SHALL fetch the kit's components, validate stock for every component, and apply all increments/decrements inside the same `$transaction` — no partial commits

### Requirement: Role-based filter security boundary is enforced server-side
The `createdById` filter on `getAll` and `getStats` is enforced at the server, not the client. For non-admin users, the server SHALL force `createdById = ctx.user.id` regardless of the client payload.

#### Scenario: Non-admin user requests movements filtered by another user
- **WHEN** a non-admin user calls `movements.getAll` with `createdById` set to a different user's ID
- **THEN** the server SHALL silently override `createdById` to `ctx.user.id` — the client payload is ignored for this field

#### Scenario: Admin user requests movements filtered by another user
- **WHEN** an admin calls `movements.getAll` with any `createdById` value
- **THEN** the server SHALL apply the filter as provided without override

### Requirement: Movement creation uses atomic stock + ledger transaction
Stock updates and movement record creation MUST occur inside a single `prisma.$transaction`. No partial state (stock updated without a movement record, or vice versa) is acceptable.

#### Scenario: Database error occurs mid-transaction
- **WHEN** an error occurs after stock has been updated but before the movement record is committed
- **THEN** Prisma's transaction rollback SHALL revert the stock change — the database is left in a consistent state
