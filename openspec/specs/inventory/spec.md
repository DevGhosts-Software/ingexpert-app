# Inventory Spec — Ingexpert

> **Source of Truth for Endpoint Contracts**: Before implementing any item or kit route, data model change, or frontend hook, read **`openapi/openapi.json`** for the exact endpoint shapes, request/response schemas, and authentication requirements for this domain.

Covers: Items and Kits domain — CRUD rules, `ItemType` enum, stock Decimal handling, Kit composition and expansion, bulk import, Excel type mapping, item table UI conventions.

---

## Item Model

| Field      | Type       | Notes                                                       |
| ---------- | ---------- | ----------------------------------------------------------- |
| `id`       | `String`   | UUID                                                        |
| `code`     | `String`   | Natural identifier — unique, used for bulk import matching  |
| `name`     | `String`   | Display name                                                |
| `location` | `String`   | Physical location. Empty string for KIT items.              |
| `stock`    | `Decimal`  | Serialized to `number` in service mappers via `.toNumber()` |
| `unit`     | `String`   | Unit of measure                                             |
| `type`     | `ItemType` | `PRODUCT`, `EQUIPMENT`, `TOOL`, or `KIT`                    |
| `imageUrl` | `String?`  | Optional image URL                                          |

**KIT items** have no meaningful stock or location. They are composition containers only — `stock: 0, location: ''`.

---

## ItemType Enum

| Value       | Description                                                            |
| ----------- | ---------------------------------------------------------------------- |
| `PRODUCT`   | Standard stocked product                                               |
| `EQUIPMENT` | Equipment (tracked, no kit composition)                                |
| `TOOL`      | Tool (can be a kit component)                                          |
| `KIT`       | Virtual bundle — no direct stock; expands into PRODUCT/TOOL components |

---

## Kit Composition Rules

- Only `PRODUCT` and `TOOL` items may be kit components.
- `EQUIPMENT` and `KIT` items are **not** valid kit components.
- Kit components are managed via the `kits/` module (`SetKitComponents` procedure).
- When a movement references a KIT, the service **expands** it into all its components before applying stock changes.

---

## Stock Serialization

`Item.stock` and `MovementDetail.quantity` are `Prisma.Decimal` in the database. Service mappers **must** call `.toNumber()` before returning:

```typescript
private mapItem(item: Item): ItemEntity {
  return {
    ...item,
    stock: item.stock.toNumber(), // Decimal → number
  };
}
```

Adding a new `Decimal` column to `Item` causes a TypeScript error in `mapItem()` until updated — this is the compile-time safety guarantee.

---

## Bulk Import Pattern

For batch writes (Excel import), use the **pre-fetch + bulk** pattern (not a single `$transaction`):

1. One query: `findMany` all existing items by `code`.
2. `createMany` for new items.
3. `update` with `stock: { increment: value }` for existing items — **never replace the whole record**.

Match by `code` (natural identifier), not `name`. See `core-architecture/spec.md` for the full code pattern.

---

## Schema — Inventory Domain Modules

| File             | DTOs                                                                 | Entities                                | Output schemas                                                              |
| ---------------- | -------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `item.schema.ts` | `CreateItemSchema`, `UpdateItemSchema`, `ItemPaginationSchema`       | `ItemEntity`, `ItemStats`, `ItemCounts` | `ItemEntitySchema`, `ItemListSchema`, `ItemStatsSchema`, `ItemCountsSchema` |
| `kit.schema.ts`  | `SetKitComponentsSchema`, `KitComponentSchema`, `KitImportRowSchema` | `KitComponentEntity`                    | `KitSummarySchema`                                                          |

---

## Frontend — Table Row Accents (Inventory)

Use `style={{ boxShadow: 'inset 2px 0 0 <hex>' }}` on `<TableRow>`. Do **not** use `border-l-*` Tailwind classes.

| ItemType    | Hex       | Tailwind   |
| ----------- | --------- | ---------- |
| `PRODUCT`   | `#2563eb` | blue-600   |
| `EQUIPMENT` | `#9333ea` | purple-600 |
| `TOOL`      | `#ea580c` | orange-600 |
| `KIT`       | `#0891b2` | cyan-600   |

---

## Frontend — KIT Row Placeholders

KIT items have no image, location, stock, or unit. Render `—` (em-dash) with `text-muted-foreground/50` for these cells. Never render `0` or empty string for KIT stock/location.

---

## Frontend — ItemType Excel Mapping

`ItemType` is stored in English in the DB but written/read in Spanish in Excel files:

| DB value    | Excel label   |
| ----------- | ------------- |
| `PRODUCT`   | `PRODUCTO`    |
| `EQUIPMENT` | `EQUIPO`      |
| `TOOL`      | `HERRAMIENTA` |
| `KIT`       | `KIT`         |

`parseItemType()` in the import dialog accepts both Spanish and English values. Unknown values default to `PRODUCT`.

---

## Frontend — WorkAreaCombobox

For autocomplete fields that accept both existing suggestions and new free-form values (e.g. `workArea`), use the shared `WorkAreaCombobox` built on shadcn `Popover` + `Command`.

**Location:** `src/features/users/components/work-area-combobox.tsx`

```typescript
import { WorkAreaCombobox } from './work-area-combobox';

<FormControl>
  <WorkAreaCombobox
    value={field.value}
    onChange={field.onChange}
    workAreas={workAreas}   // string[] from trpc.adminUsers.getWorkAreas
    disabled={isPending}
  />
</FormControl>
```

| Prop        | Type                          | Description                          |
| ----------- | ----------------------------- | ------------------------------------ |
| `value`     | `string \| null \| undefined` | Current form value                   |
| `onChange`  | `(v: string \| null) => void` | Called on selection or creation      |
| `workAreas` | `string[]`                    | Existing suggestions from the server |
| `disabled`  | `boolean`                     | Mirrors form `isPending`             |

- Selecting an already-selected item **deselects** it (sets `null`).
- When typed text doesn't match any existing area, a **"Crear «...»"** option appears.
- Width matches the trigger via `w-[--radix-popover-trigger-width]`.
- **Do not** revert to a plain `<Input>` + manual dropdown for this field.

---

## Requirement: Inventory reads SHALL use PowerSync SQL subscriptions

Inventory-facing frontend screens MUST replace tRPC read hooks with PowerSync `useQuery` SQL reads against local SQLite tables synchronized by PowerSync.

#### Scenario: Inventory list loads from local SQLite

- **WHEN** the inventory list screen initializes
- **THEN** it MUST execute a PowerSync `useQuery` statement instead of `trpc.inventory.*.useQuery`
- **THEN** it MUST render data from the local SQLite result set without requiring network availability

## Requirement: Inventory SQL projection mapping MUST minimize unnecessary aliasing

Local PowerSync SQL queries MUST avoid aliasing database columns unless aliasing is required to satisfy a consuming contract.

#### Scenario: Query row types keep native DB names

- **WHEN** a query result is consumed internally by local transformation logic
- **THEN** columns such as `image_url` MUST be selected using native DB names without alias-only convenience mappings

#### Scenario: Contract boundary maps only required fields

- **WHEN** local row data is converted into frontend entity shapes that require camelCase fields
- **THEN** mapping to fields such as `imageUrl` MUST occur at a single boundary transform step
- **THEN** duplicate SQL and post-query remapping for the same field MUST be avoided

## Requirement: Local-first writes SHALL remove blocking write spinners

Inventory/movement write interactions that execute fully in local SQLite MUST not block user flow on network round-trips.

#### Scenario: Movement save no longer shows server-wait spinner

- **WHEN** the user submits a movement and local DB writes succeed
- **THEN** the UI MUST reflect success and updated stock immediately
- **THEN** legacy loading spinners tied to remote mutation completion MUST be removed

## Requirement: Item writes SHALL complete from local queue commit

Item create, edit, and save interactions MUST complete immediately after local SQLite write/queue commit without waiting for remote mutation completion.

#### Scenario: Create item commits locally and returns immediate success

- **WHEN** a user submits a new item and local write succeeds
- **THEN** the UI MUST confirm success immediately from local commit
- **THEN** cloud upload MUST be marked as queued/pending and run asynchronously

#### Scenario: Edit item commits locally and updates list instantly

- **WHEN** a user saves edits to an existing item and local write succeeds
- **THEN** the updated item data MUST be visible immediately in local query-backed views
- **THEN** no blocking spinner tied to remote tRPC mutation completion may delay success state

## Requirement: Inventory write flows MUST avoid hidden online dependencies

Inventory write flows MUST not include hidden awaited tRPC reads/mutations that block post-save UX completion.

#### Scenario: Save flow executes while offline

- **WHEN** the user saves item changes while offline
- **THEN** save flow MUST finish from local operations only
- **THEN** the UI MUST communicate queued sync state instead of waiting for network recovery

## Requirement: Inventory local-computable reads SHALL run without runtime API fallback

Inventory reads already accepted for local-first execution MUST use PowerSync/SQLite as the only runtime read source.

#### Scenario: Kit component composition is requested

- **WHEN** the UI requests kit component composition for an existing kit
- **THEN** the client MUST resolve components from local synchronized tables
- **THEN** no runtime API fallback branch may execute for this read path

## Requirement: Inventory dashboard aggregates SHALL be computed locally after cutover

Lightweight inventory card metrics in dashboard and inventory surfaces MUST be derived locally once parity acceptance has been completed.

#### Scenario: Inventory cards render after migration finalization

- **WHEN** the dashboard or inventory cards request aggregate counts
- **THEN** totals MUST be computed from local SQLite synchronized data
- **THEN** removed API aggregate endpoints MUST not be called

## Requirement: Inventory stats migration SHALL preserve aggregate parity

Migration of inventory stats MUST preserve exact aggregate semantics currently exposed to the dashboard.

#### Scenario: Inventory stats are computed locally

- **WHEN** local computation is enabled for inventory stats
- **THEN** field-level totals (`total`, `products`, `equipment`, `tools`, `kits`) MUST match API parity criteria
- **THEN** mismatches MUST trigger rollback handling
