# Ingexpert Frontend - Agent Context

This document provides a detailed analysis and specific guidelines for the **Ingexpert Frontend** (`apps/frontend`) workspace.

## 1. Project Overview

**Ingexpert Frontend** is the user interface for the Stock Management System. It is a strictly typed client that consumes the `@ingexpert/api` via tRPC.

## 2. Documentation & Guidelines

Before generating code, verify alignment with these documents:

- **[Shadcn AI Guide](docs/shadcn-ai-guide.md)**: Specific patterns for using and generating shadcn/ui components.

## 3. Technology Stack

- **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/docs)
- **Language:** TypeScript 5.x
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind)
- **Data Fetching:** [tRPC](https://trpc.io/) + [TanStack Query](https://tanstack.com/query/latest)
- **Form Management:** `react-hook-form` + `zod`

## 4. Project Architecture

The project follows a **Feature-Sliced Design**.

```
apps/frontend/src/
├── app/                      # Next.js App Router (CONTAINERS)
│   ├── (auth)/               # Login page (Admin-only registration)
│   ├── (dashboard)/          # Protected routes
│   │   ├── admin/            # Admin-only pages (User management)
│   │   ├── inventory/        # Stock management
│   │   └── page.tsx          # Dashboard Home
│   └── layout.tsx            # Root layout
│
├── components/               # Shared UI components (PRESENTERS)
│   ├── ui/                   # Base shadcn/ui components
│   └── providers/            # Providers (TRPCProvider)
│
├── features/                 # Feature-based Modules
│   ├── [feature]/
│   │   ├── components/       # Feature-specific PRESENTERS
│   │   └── hooks/            # Logic & State Hooks
│
├── lib/
│   └── trpc.ts               # tRPC Client Instance
```

## 5. The Container/Presenter Pattern

To ensure separation of concerns, adherence to the **Container/Presenter** pattern is mandated.

### 5.1 The Container (`src/app/**/page.tsx`)

The **Page** is the "Manager". It owns all data fetching and filter state.

- **Role:**
  - **Data Fetching:** Uses `trpc.[domain].[procedure].useQuery()`.
  - **Filter State:** Owns `useState` for pagination, search, sorting, and filter values.
  - **Stable handlers:** All callbacks passed to Presenters must be wrapped in `useCallback`. Derived data arrays (e.g., mapped items) must be wrapped in `useMemo`.
  - **Loading defaults:** Declare module-level `DEFAULT_*` constants for the empty/loading state of each query result. Use `data ?? DEFAULT_VALUE` when passing to Presenters — never reconstruct objects field-by-field inline.
  - **Passes Data:** Props down to Presenters.

```typescript
// ✅ correct
const DEFAULT_STATS: ItemStats = { total: 0, products: 0, ... };
<InventoryStats stats={statsData ?? DEFAULT_STATS} />

// ❌ wrong — fragile, misses new fields silently
const stats = { total: statsData?.total ?? 0, products: statsData?.products ?? 0, ... };
```

### 5.2 The Presenter (`src/features/**/components/*.tsx`)

The **Component** is the "Visualizer" and "Actor".

- **Role:**
  - Renders data provided by the Container.
  - Handles user interactions — including mutations (`trpc.[domain].[procedure].useMutation()`).
- **Rules:**
  - **NEVER** call `useQuery` directly — all data comes via props.
  - Mutations are allowed — they are user-triggered write actions, not passive data fetches.
  - **ALWAYS** use `shadcn/ui` components.

## 6. Type Rules

- **Import entity types from `@ingexpert/schema`**, never declare local interfaces that duplicate API data shapes.
- **Import DTO types from `@ingexpert/schema`** for form `type FormValues`. Use `.extend()` on the shared schema only to add UI-specific error messages — the type itself stays as the shared `CreateXxxDto`.
- **Import `ItemType`, `ItemCounts`, `ItemStats`, etc. from `@ingexpert/schema`** in page files — do not import them from feature components.
- Feature type files (`[feature].types.ts`) may re-export schema types under local aliases for ergonomics, but the originals are always `@ingexpert/schema`.

```typescript
// ✅ page imports types from schema directly
import type { ItemCounts, ItemStats, ItemType } from '@ingexpert/schema';

// ✅ feature types re-export for local ergonomics
export type { ItemEntity as InventoryItem } from '@ingexpert/schema';

// ❌ local interface duplicating the API shape
interface InventoryItem { id: string; name: string; stock: number; ... }
```

## 7. Cache Invalidation Pattern

After every successful mutation (`onSuccess`), invalidate **all related queries** using `trpc.useUtils()`:

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

- **Invalidate broadly** — a single mutation can affect the list, stats, counts, and dropdowns simultaneously. Surgical `setQueryData` updates are error-prone; broad invalidation is safer.
- No optimistic updates — the system waits for server confirmation before refreshing. This is intentional for a stock system where accuracy matters.

## 8. Implementation Mapping for AI Agents

| Resource Type     | File Name (Kebab-Case)        | Code Identifier                         |
| :---------------- | :---------------------------- | :-------------------------------------- |
| **Container**     | `page.tsx`                    | `export default function Page()`        |
| **Presenter**     | `[feature]-table.tsx`         | `export function FeatureTable()`        |
| **Columns**       | `[feature]-table.columns.tsx` | `export function getColumns()`          |
| **Types file**    | `[feature]-table.types.ts`    | Re-exports from `@ingexpert/schema`     |
| **Toolbar**       | `[feature]-table-toolbar.tsx` | `export function FeatureTableToolbar()` |
| **tRPC Query**    | `page.tsx`                    | `trpc.items.list.useQuery()`            |
| **tRPC Mutation** | `[component].tsx`             | `trpc.items.create.useMutation()`       |

### Feature Table Modularization

Each feature table is split into dedicated files (see `src/features/inventory/components/` and `src/features/users/components/`):

- `[feature]-table.types.ts` — re-exports entity/role types from `@ingexpert/schema`, defines table-specific interfaces (`TableProps`, `ActiveTab`, etc.)
- `[feature]-table.columns.tsx` — column definitions (`getColumns()`), row-level action components, dialog components (confirm, reset password, etc.)
- `[feature]-table-toolbar.tsx` — search, filter tabs, create button
- `[feature]-table.tsx` — assembles TanStack Table, renders toolbar + table + pagination

## 9. Conventions & Best Practices

- **Styling:** Use Tailwind Utility classes.
- **Forms:** Use `react-hook-form`. Resolver: `zodResolver(CreateXxxSchema.extend({ ... }))`. Type: `CreateXxxDto` from `@ingexpert/schema`.
- **Components:** Import from `@/components/ui`.

## 10. Debouncing User Input

Any input that triggers a **tRPC query or API call** (search boxes, filter inputs, etc.) **MUST** be debounced using the shared `useDebounce` hook before being passed to the query.

```typescript
import { useDebounce } from '@/hooks/use-debounce';

// ✅ correct — raw state drives the UI, debounced value drives the API
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search); // default 400 ms

const { data } = trpc.items.list.useQuery({
  search: debouncedSearch || undefined,
});

// ❌ wrong — fires a network request on every keystroke
const { data } = trpc.items.list.useQuery({ search: search || undefined });
```

**Rules:**

- The Container owns **both** the raw state (for instant UI feedback) and the debounced value (for API calls).
- Pass the **raw** value to the Presenter's input so the user sees their keystrokes without delay.
- Pass the **debounced** value to every `useQuery` that uses it.
- Default delay is **400 ms** — do not lower it without a strong reason.
- `useDebounce` is generic (`useDebounce<T>`) and works with any value type.

## 11. Role-Based UI

Use the `useIsAdmin()` hook (`src/hooks/use-is-admin.ts`) to gate admin-only UI. It reads `trpc.users.me` with `staleTime: Infinity` — the layout has already fetched it, so **no extra network request** is made.

```typescript
import { useIsAdmin } from '@/hooks/use-is-admin';

// In the page container — pass down as a prop
const isAdmin = useIsAdmin();
<InventoryTable isAdmin={isAdmin} ... />

// In a presenter — receive as prop, never call useQuery directly
{isAdmin && <Button>Agregar item</Button>}
```

- `isAdmin` flows from the **Container** (page) down to Presenters as a prop — Presenters never call `useIsAdmin()` directly.
- Exception: shared layout-level components (e.g. `AppSidebar`) that are not feature Presenters may call `useIsAdmin()` directly.
- The API enforces authorization independently via `adminProcedure` — the UI gates are a UX layer only.

## 12. On-Demand Fetch (no persistent query)

For actions that fetch data only once on user trigger (e.g. "Export to Excel"), use `utils.[domain].[procedure].fetch()` instead of `useQuery`. This avoids a persistent subscription and only runs when called.

```typescript
const utils = trpc.useUtils();

const handleExport = async () => {
  const items = await utils.items.getAll.fetch(); // one-shot, no re-render subscription
  // ... generate file
};
```

## 13. Row-Level Actions Pattern (`RowActions`)

Row action menus (`DropdownMenu`) in column definitions may call `trpc.users.me.useQuery()` **directly** — this is an explicit exception to the "Presenters never call useQuery" rule. `users.me` is already fetched and cached by the dashboard layout; calling it again in a row action component costs zero network requests.

```typescript
// ✅ allowed — cached by layout, no extra network request
function RowActions({ user }: { user: UserEntity }) {
  const { data: me } = trpc.users.me.useQuery();
  const canEdit = me?.id === user.id || user.role !== 'ADMIN';
  // ...
}
```

Only `trpc.users.me` (or equivalently cached queries with `staleTime: Infinity`) may be called this way. All other queries must come via props from the Container.

## 14. Free-Form Autocomplete Input Pattern

**Do NOT use `@base-ui/react` `Combobox` for free-form text fields.** Base UI Combobox does not allow free-form input — after selection it clears the input value and controlling both `value` + `inputValue` causes conflicts.

For autocomplete fields that accept both typed-in values and suggestions (e.g. `workArea`), implement a custom `WorkAreaCombobox` sub-component:

```typescript
// Must be a named sub-component (hooks cannot be used in render prop callbacks)
function WorkAreaCombobox({ field, workAreas, disabled }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputValue = field.value ?? '';
  const filtered = workAreas.filter((a) => a.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={(e) => { field.onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={/* arrow/enter/escape navigation */}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
          {filtered.map((area, i) => (
            <li
              key={area}
              onMouseDown={(e) => e.preventDefault()} // prevent blur before click
              onClick={() => { field.onChange(area); setOpen(false); }}
              className={cn('px-3 py-2 text-sm cursor-pointer', i === highlighted && 'bg-accent')}
            >
              {area}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Key rules:

- `onMouseDown={e.preventDefault()}` on list items is **required** — prevents the input blur from firing before the click registers.
- `setTimeout(() => setOpen(false), 150)` on blur gives the click time to fire.
- The component must be a named function (not inline) to use `useState`.

## 18. Excel Import / Export — Spanish Enum Labels

The `ItemType` enum is stored in the DB and sent over tRPC in English (`PRODUCT`, `EQUIPMENT`, `TOOL`, `KIT`). For Excel files (Ingexpert is a Spanish-language company), the `TIPO` column is always written and read in Spanish:

| DB / tRPC value | Excel label   |
| --------------- | ------------- |
| `PRODUCT`       | `PRODUCTO`    |
| `EQUIPMENT`     | `EQUIPO`      |
| `TOOL`          | `HERRAMIENTA` |
| `KIT`           | `KIT`         |

**Export** (`inventory-table-toolbar.tsx`): use a `TYPE_ES` lookup map to convert before writing the cell.  
**Import** (`import-excel-dialog.tsx`): `parseItemType()` accepts both the Spanish label _and_ the English name so that manually edited files still work. Anything unrecognised defaults to `PRODUCT`.

**Never conditionally swap two different `<Form>` (or any large component tree) inside a Radix `Sheet` or `Dialog`.** Radix's `FocusScope` re-initializes its focus trap when large DOM subtrees are unmounted and remounted, temporarily blocking pointer events on all inputs.

**Wrong:**

```tsx
// ❌ Swapping Form providers unmounts the DOM subtree → FocusScope blocks all inputs
{
  noAuth ? <Form {...noAuthForm}>...</Form> : <Form {...form}>...</Form>;
}
```

**Correct:** Use a **single `<Form>`** with one `useForm` instance. Use `superRefine` for conditional validation, and conditionally show/hide sections with `{condition && <>...</>}`:

```tsx
// ✅ Single form — no DOM remounting, FocusScope stays stable
const schema = z.object({
  noAuth: z.boolean(),
  password: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.noAuth && !data.password) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Requerido' });
  }
});

const form = useForm({ resolver: zodResolver(schema) });
const noAuth = form.watch('noAuth');

// In JSX — no conditional Form wrapper:
{!noAuth && (
  <FormField name="password" ... />
)}
```

## 17. Navbar & User Profile

`DashboardNavbar`(`src/components/dashboard-navbar.tsx`) accepts `user` and `onLogout` props. It renders a clickable `Avatar` (shadcn `Avatar` + `AvatarFallback` with initials) that opens `UserProfileSheet`.

`UserProfileSheet` (`src/features/users/components/user-profile-sheet.tsx`) is the **only** way for any user to edit their own name, avatar URL, and password. It uses:

- `trpc.users.updateMe` — for name and avatar.
- `trpc.users.updateMyPassword` — for password change (protectedProcedure, self only).

The logout button lives inside `UserProfileSheet` (passed as `onLogout` prop from layout → navbar → sheet).
