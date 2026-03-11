# Inventory Spec — Ingexpert

> **Source of Truth for Endpoint Contracts**: Before implementing any item or kit route, data model change, or frontend hook, read **`openapi/openapi.json`** for the exact endpoint shapes, request/response schemas, and authentication requirements for this domain.

Covers: Items and Kits domain — CRUD rules, `ItemType` enum, stock Decimal handling, Kit composition and expansion, bulk import, Excel type mapping, item table UI conventions.

---

## Item Model

| Field | Type | Notes |
|---|---|---|
| `id` | `String` | UUID |
| `code` | `String` | Natural identifier — unique, used for bulk import matching |
| `name` | `String` | Display name |
| `location` | `String` | Physical location. Empty string for KIT items. |
| `stock` | `Decimal` | Serialized to `number` in service mappers via `.toNumber()` |
| `unit` | `String` | Unit of measure |
| `type` | `ItemType` | `PRODUCT`, `EQUIPMENT`, `TOOL`, or `KIT` |
| `imageUrl` | `String?` | Optional image URL |

**KIT items** have no meaningful stock or location. They are composition containers only — `stock: 0, location: ''`.

---

## ItemType Enum

| Value | Description |
|---|---|
| `PRODUCT` | Standard stocked product |
| `EQUIPMENT` | Equipment (tracked, no kit composition) |
| `TOOL` | Tool (can be a kit component) |
| `KIT` | Virtual bundle — no direct stock; expands into PRODUCT/TOOL components |

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

| File | DTOs | Entities | Output schemas |
|---|---|---|---|
| `item.schema.ts` | `CreateItemSchema`, `UpdateItemSchema`, `ItemPaginationSchema` | `ItemEntity`, `ItemStats`, `ItemCounts` | `ItemEntitySchema`, `ItemListSchema`, `ItemStatsSchema`, `ItemCountsSchema` |
| `kit.schema.ts` | `SetKitComponentsSchema`, `KitComponentSchema`, `KitImportRowSchema` | `KitComponentEntity` | `KitSummarySchema` |

---

## Frontend — Table Row Accents (Inventory)

Use `style={{ boxShadow: 'inset 2px 0 0 <hex>' }}` on `<TableRow>`. Do **not** use `border-l-*` Tailwind classes.

| ItemType | Hex | Tailwind |
|---|---|---|
| `PRODUCT` | `#2563eb` | blue-600 |
| `EQUIPMENT` | `#9333ea` | purple-600 |
| `TOOL` | `#ea580c` | orange-600 |
| `KIT` | `#0891b2` | cyan-600 |

---

## Frontend — KIT Row Placeholders

KIT items have no image, location, stock, or unit. Render `—` (em-dash) with `text-muted-foreground/50` for these cells. Never render `0` or empty string for KIT stock/location.

---

## Frontend — ItemType Excel Mapping

`ItemType` is stored in English in the DB but written/read in Spanish in Excel files:

| DB value | Excel label |
|---|---|
| `PRODUCT` | `PRODUCTO` |
| `EQUIPMENT` | `EQUIPO` |
| `TOOL` | `HERRAMIENTA` |
| `KIT` | `KIT` |

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

| Prop | Type | Description |
|---|---|---|
| `value` | `string \| null \| undefined` | Current form value |
| `onChange` | `(v: string \| null) => void` | Called on selection or creation |
| `workAreas` | `string[]` | Existing suggestions from the server |
| `disabled` | `boolean` | Mirrors form `isPending` |

- Selecting an already-selected item **deselects** it (sets `null`).
- When typed text doesn't match any existing area, a **"Crear «...»"** option appears.
- Width matches the trigger via `w-[--radix-popover-trigger-width]`.
- **Do not** revert to a plain `<Input>` + manual dropdown for this field.
