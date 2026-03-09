# Frontend Spec — `apps/frontend`

Next.js (App Router) + React 19 + TanStack Query + tRPC client. Packaged as a desktop app with Tauri 2.

---

## Project Structure

```
apps/frontend/src/
├── app/                      # Next.js App Router (CONTAINERS)
│   ├── (auth)/               # Login page
│   ├── (dashboard)/          # Protected routes
│   │   ├── admin/            # Admin-only pages
│   │   ├── inventory/
│   │   ├── movements/
│   │   └── projects/
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # shadcn/ui base components
│   └── providers/            # TRPCProvider
├── features/                 # Feature modules
│   └── [feature]/
│       ├── components/       # Presenters
│       └── hooks/            # Logic hooks
└── lib/
    └── trpc.ts               # tRPC client
```

---

## Container / Presenter Pattern

This pattern is **mandatory** — no exceptions.

### Container (`src/app/**/page.tsx`)

The Page is the **Manager**. It owns all data fetching and filter state.

- Calls `trpc.[domain].[procedure].useQuery()` for all data.
- Owns `useState` for pagination, search, sorting, filter values.
- Wraps callbacks in `useCallback`, derived data in `useMemo`.
- Uses module-level `DEFAULT_*` constants for loading states.
- Passes data down to Presenters as props.

```typescript
// ✅ correct — stable reference for loading state
const DEFAULT_STATS: ItemStats = { total: 0, products: 0, equipment: 0, tools: 0, kits: 0 };
<InventoryStats stats={statsData ?? DEFAULT_STATS} />

// ❌ wrong — reconstructs object every render, misses new fields silently
const stats = { total: statsData?.total ?? 0, products: statsData?.products ?? 0 };
```

### Presenter (`src/features/**/components/*.tsx`)

The Component is the **Visualizer** and **Actor**.

- Renders data received from the Container via props.
- May call `trpc.[domain].[procedure].useMutation()` — mutations are user-triggered writes.
- **Never** calls `useQuery` directly (exception: see §Row-Level Actions).
- Always uses `shadcn/ui` components.

---

## File Naming Map

| Resource | File name | Export |
|---|---|---|
| Container | `page.tsx` | `export default function Page()` |
| Presenter | `[feature]-table.tsx` | `export function FeatureTable()` |
| Columns | `[feature]-table.columns.tsx` | `export function getColumns()` |
| Types | `[feature]-table.types.ts` | Re-exports from `@ingexpert/schema` |
| Toolbar | `[feature]-table-toolbar.tsx` | `export function FeatureTableToolbar()` |

---

## Type Rules

- **Import entity types from `@ingexpert/schema`** — never declare local interfaces that duplicate API shapes.
- **Import DTO types from `@ingexpert/schema`** for form `type FormValues`. Use `.extend()` only to add UI error messages.
- Feature types files may re-export schema types under local aliases for ergonomics.

```typescript
// ✅ correct
import type { ItemCounts, ItemStats, ItemType } from '@ingexpert/schema';
export type { ItemEntity as InventoryItem } from '@ingexpert/schema';

// ❌ wrong — duplicates the API shape and breaks DB-schema link
interface InventoryItem { id: string; name: string; stock: number; }
```

---

## Cache Invalidation Pattern

After every mutation `onSuccess`, invalidate **all related queries**:

```typescript
const utils = trpc.useUtils();

const createMutation = trpc.items.create.useMutation({
  onSuccess: () => {
    void Promise.all([
      utils.items.list.invalidate(),
      utils.items.getStats.invalidate(),
      utils.items.getCounts.invalidate(),
      utils.items.getLocations.invalidate(),
    ]);
    onClose();
  },
});
```

- Invalidate broadly — a single mutation can affect lists, stats, counts, and dropdowns.
- No optimistic updates — the system waits for server confirmation. This is intentional for a stock system.

---

## Debouncing User Input

Any input that triggers a tRPC query **must** be debounced:

```typescript
import { useDebounce } from '@/hooks/use-debounce';

// ✅ correct — raw state drives UI, debounced value drives API
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search); // default 400 ms

const { data } = trpc.items.list.useQuery({ search: debouncedSearch || undefined });

// ❌ wrong — fires network request on every keystroke
const { data } = trpc.items.list.useQuery({ search: search || undefined });
```

**Rules:**
- Container owns both raw state (UI) and debounced value (API).
- Pass **raw** value to Presenter input. Pass **debounced** value to `useQuery`.
- Default delay is **400 ms**.

---

## Role-Based UI

Use `useIsAdmin()` (`src/hooks/use-is-admin.ts`) to gate admin-only UI. It reads `trpc.users.me` with `staleTime: Infinity` — no extra network request.

```typescript
// ✅ correct — isAdmin flows from Container to Presenter as prop
const isAdmin = useIsAdmin(); // in page container
<InventoryTable isAdmin={isAdmin} ... />

// In presenter — receives as prop, never calls useIsAdmin() directly
{isAdmin && <Button>Agregar item</Button>}
```

Exception: layout-level components (e.g. `AppSidebar`) may call `useIsAdmin()` directly.

---

## On-Demand Fetch (one-shot)

For actions triggered by user interaction (e.g. "Export to Excel"), use `utils.fetch()` instead of `useQuery`:

```typescript
const utils = trpc.useUtils();

const handleExport = async () => {
  const items = await utils.items.getAll.fetch(); // no persistent subscription
  // generate Excel file...
};
```

---

## Row-Level Actions Exception

Row action menus may call `trpc.users.me.useQuery()` **directly** — it is cached by the dashboard layout, so no extra network request is made:

```typescript
function RowActions({ user }: { user: UserEntity }) {
  const { data: me } = trpc.users.me.useQuery(); // ✅ cached — zero network cost
  const canEdit = me?.id === user.id || user.role !== 'ADMIN';
}
```

Only `trpc.users.me` (or equivalent `staleTime: Infinity` queries) may be used this way.

---

## Forms

- Use `react-hook-form` with `zodResolver`.
- Import the shared schema from `@ingexpert/schema`, extend only for UI-specific error messages.
- Type stays as the shared DTO — never redefine locally.

```typescript
import { CreateItemSchema, type CreateItemDto } from '@ingexpert/schema';

const FormSchema = CreateItemSchema.extend({
  name: z.string().min(1, 'Nombre requerido'),
});
type FormValues = CreateItemDto; // type is still the shared DTO

const form = useForm<FormValues>({ resolver: zodResolver(FormSchema) });
```

---

## Table Visual Conventions

### Per-Type Row Accents

Use `style={{ boxShadow: 'inset 2px 0 0 <hex>' }}` on `<TableRow>` for the colored left border. **Do not use `border-l-*` Tailwind classes** — they disappear on the last row due to `border-collapse: collapse`.

| Type | Hex | Tailwind |
|---|---|---|
| PRODUCT / PURCHASE | `#2563eb` | blue-600 |
| EQUIPMENT | `#9333ea` | purple-600 |
| TOOL / EXIT | `#ea580c` | orange-600 |
| KIT | `#0891b2` | cyan-600 |
| RETURN | `#16a34a` | green-600 |
| WRITEOFF | `#dc2626` | red-600 |

### KIT Row Placeholders

KIT items have no image, location, stock, or unit. Render `—` (em-dash) with `text-muted-foreground/50`.

### Sidebar Active State

```typescript
isActive={item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)}
```

---

## Single Form Rule (Radix Sheets / Dialogs)

**Never** conditionally swap two different `<Form>` trees inside a Radix `Sheet` or `Dialog`. Radix's `FocusScope` re-initializes when large DOM subtrees unmount/remount, temporarily blocking all pointer events.

```tsx
// ❌ wrong — swapping Form providers unmounts the subtree
{noAuth ? <Form {...noAuthForm}>...</Form> : <Form {...form}>...</Form>}

// ✅ correct — single Form, conditional sections via {condition && <>...</>}
const form = useForm({ resolver: zodResolver(schema) });
const noAuth = form.watch('noAuth');
{!noAuth && <FormField name="password" ... />}
```

---

## ItemType Excel Mapping

`ItemType` is stored in English in the DB but written/read in Spanish in Excel files:

| DB value | Excel label |
|---|---|
| `PRODUCT` | `PRODUCTO` |
| `EQUIPMENT` | `EQUIPO` |
| `TOOL` | `HERRAMIENTA` |
| `KIT` | `KIT` |

`parseItemType()` in the import dialog accepts both Spanish and English values. Unknown values default to `PRODUCT`.

---

## shadcn/ui Rules

- Import all components from `@/components/ui` (never relative paths).
- Use `"use client"` for interactive components.
- Never use raw HTML form elements — always use shadcn `Form`, `Input`, `Select`, etc.
- Install new components via: `npx shadcn-ui@latest add <component>` from `apps/frontend`.
