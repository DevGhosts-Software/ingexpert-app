# Movements Spec — Ingexpert

> **Source of Truth for Endpoint Contracts**: Before implementing any movement route, ledger logic change, or frontend hook, read **`openapi/openapi.json`** for the exact endpoint shapes, request/response schemas, and authentication requirements for this domain.

Covers: Movement ledger — create-only immutability, stock direction rules per `MovementType`, Kit expansion in transactions, role-based filter security boundary, movement schemas, and movement UI components.

---

## Core Rule: Movements Are Immutable

Movements are **create-only** by design. Once created:

- No `update` mutation is exposed on the frontend.
- Stock changes are applied atomically inside `$transaction` on creation.
- The movement record is permanent and auditable.

---

## Movement Model

| Field                    | Type                   | Notes                                            |
| ------------------------ | ---------------------- | ------------------------------------------------ |
| `id`                     | `String`               | UUID                                             |
| `type`                   | `MovementType`         | `PURCHASE`, `RETURN`, `EXIT`, or `WRITEOFF`      |
| `createdById`            | `String` (FK→User)     | Always `ctx.user.id` — not overridable by client |
| `responsibleDeliveryId?` | `String?` (FK→User)    | For EXIT movements                               |
| `responsibleReceiptId?`  | `String?` (FK→User)    | For PURCHASE/RETURN movements                    |
| `projectId?`             | `String?` (FK→Project) | Optional project link                            |
| `destination?`           | `String?`              | Physical destination                             |
| `observations?`          | `String?`              | Notes, mandatory for WRITEOFF                    |
| `date`                   | `DateTime`             | Serialized as ISO string over JSON               |

`MovementDetail` (line items):
| Field | Type | Notes |
|---|---|---|
| `id` | `String` | UUID |
| `movementId` | `String` (FK→Movement, `onDelete: Cascade`) | Parent movement |
| `itemId` | `String` (FK→Item) | Referenced item |
| `quantity` | `Decimal` | Serialized via `.toNumber()` in mapper |

---

## MovementType Enum

| Type       | Stock effect | Validation                               |
| ---------- | ------------ | ---------------------------------------- |
| `PURCHASE` | Increment    | None                                     |
| `RETURN`   | Increment    | None                                     |
| `EXIT`     | Decrement    | Validates sufficient stock before commit |
| `WRITEOFF` | Decrement    | Validates sufficient stock before commit |

---

## Kit Expansion

When a movement detail references a `KIT` item, the service expands it into its components and validates/adjusts stock for each component individually. **All-or-nothing:** if any component has insufficient stock, the entire transaction is rejected.

---

## Role-Based Filters — Security Boundary

`getAll` and `getStats` accept optional `MovementFiltersDto` (`createdById`, `dateFrom`, `dateTo`).

- **Admins:** May filter by any `createdById`.
- **Non-admins:** Server **forces** `createdById = ctx.user.id` regardless of client payload.

This is the security boundary — not the UI. Even if the frontend sends a different `createdById`, the server overrides it.

---

## Schema — Movements Domain Modules

| File                 | DTOs                                                                    | Entities                                                             | Output schemas                                                                                                  |
| -------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `movement.schema.ts` | `CreateMovementSchema`, `UpdateMovementSchema`, `MovementFiltersSchema` | `MovementHeaderEntity`, `MovementEntityWithDetails`, `MovementStats` | `MovementHeaderEntitySchema`, `MovementEntityWithDetailsSchema`, `MovementStatsSchema`, `MovementProjectSchema` |

`MovementHeaderEntity` overrides the `date` field:

```typescript
export type MovementHeaderEntity = Omit<Movement, 'date'> & { date: string /* + joined fields */ };
```

---

## Frontend — Movement Form Card Picker

The movement creation form (`movement-form-sheet.tsx`) uses a **card picker** instead of a dropdown for the movement type. Each card shows an icon, label, and short description. The selected card gets a color-coded border/background.

Fields shown per type:

| Type       | Fields displayed                                    |
| ---------- | --------------------------------------------------- |
| `PURCHASE` | Quien recibe                                        |
| `RETURN`   | Proyecto de origen · Quien devuelve el material     |
| `EXIT`     | Destino · Proyecto destino · Responsable de entrega |
| `WRITEOFF` | Warning banner (no project/people fields)           |
| All types  | Observaciones (always shown, adaptive placeholder)  |

Switching type clears all irrelevant field values via `form.setValue` to prevent stale data.

---

## Frontend — Movement Detail Sheet

`movement-detail-sheet.tsx` renders a colored header banner matching the movement type:

| MovementType | Hex       | Tailwind   |
| ------------ | --------- | ---------- |
| `PURCHASE`   | `#2563eb` | blue-600   |
| `RETURN`     | `#16a34a` | green-600  |
| `EXIT`       | `#ea580c` | orange-600 |
| `WRITEOFF`   | `#dc2626` | red-600    |

The banner shows the type badge, movement ID hash, and full date/time.

The metadata section is fully type-aware — only fields relevant to that type are rendered. `observations` is rendered as a distinct highlighted block (not an inline row) so it stands out, particularly for `WRITEOFF`.

---

## Requirement: Movement creation SHALL execute locally first

The frontend movement creation flow MUST persist data via local PowerSync SQL execution before cloud upload.

#### Scenario: Save movement writes local movement header and details

- **WHEN** a user saves a movement
- **THEN** the client MUST execute `INSERT` into `movements`
- **THEN** the client MUST execute `INSERT` into `movement_details`
- **THEN** the operation MUST complete without waiting for immediate server mutation response

## Requirement: Movement save MUST perform optimistic local stock update

After local movement detail insertion, the client MUST execute an optimistic local stock update on `items.stock` using movement direction and quantity.

#### Scenario: OUT movement updates local stock instantly

- **WHEN** a saved movement type is stock-out with quantity `q` for item `i`
- **THEN** the client MUST execute local SQL equivalent to `UPDATE items SET stock = stock - q WHERE id = i`
- **THEN** the updated stock MUST be visible in the UI immediately

#### Scenario: IN movement updates local stock instantly

- **WHEN** a saved movement type is stock-in with quantity `q` for item `i`
- **THEN** the client MUST execute local SQL equivalent to `UPDATE items SET stock = stock + q WHERE id = i`
- **THEN** the updated stock MUST be visible in the UI immediately

## Requirement: Movement create flow SHALL not depend on online-only lookups

The movement creation UX MUST use local PowerSync-backed dependency data for required selectors when available, so submitting movements remains functional offline after initial sync.

#### Scenario: Movement form opens with local dependencies offline

- **WHEN** the user opens movement form while offline
- **THEN** projects and user selector data already synchronized locally MUST be loaded from local PowerSync tables
- **THEN** form interaction MUST remain available without blocking on live tRPC queries

## Requirement: Offline movement posting MUST provide explicit queued-state feedback

When movement records are written locally and cloud upload is deferred, the user experience MUST clearly indicate local success and pending sync status.

#### Scenario: Local movement write succeeds offline

- **WHEN** movement header/details local SQL writes complete successfully while offline
- **THEN** the UI MUST confirm movement was saved locally
- **THEN** the UI MUST indicate upload is pending until connector synchronization succeeds

## Requirement: Movement reads SHALL render from local PowerSync data first

Movement list and detail/open experiences MUST render from local PowerSync SQL-backed data without blocking on online tRPC reads.

#### Scenario: Movement list opens without remote wait

- **WHEN** the movements screen initializes with synchronized local records available
- **THEN** the list MUST render from local SQLite data immediately
- **THEN** any remote refresh must occur in background without blocking initial render

#### Scenario: Movement detail opens instantly from local row

- **WHEN** a user opens a movement detail that exists locally
- **THEN** detail data MUST load from local tables without awaiting tRPC
- **THEN** the UI MUST avoid server-wait loading states for primary detail content

## Requirement: Movement read/write flow MUST avoid residual tRPC blocking

Movement-related user flows MUST remove residual awaited tRPC dependencies that delay local-first UX.

#### Scenario: Local-first movement workflows under unstable network

- **WHEN** network latency is high or connectivity is intermittent
- **THEN** movement open/list/save interactions MUST remain responsive based on local state
- **THEN** connector upload/reconciliation MUST run asynchronously with explicit pending/error status
