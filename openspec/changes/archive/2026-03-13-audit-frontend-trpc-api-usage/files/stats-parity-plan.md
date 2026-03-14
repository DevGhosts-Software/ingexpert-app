# Stats Parity Plan

Scope required by this change:

- `apps/frontend/src/app/(dashboard)/page.tsx`
- `apps/frontend/src/app/(dashboard)/admin/users/page.tsx`
- Procedures: `items.getStats`, `movements.getStats`, `projects.getStats`, `adminUsers.getStats`

## 1) `items.getStats` parity

Server implementation source: `apps/api/src/items/items.service.ts#getStats`

Expected response shape:

```ts
{
  (total, products, equipment, tools, kits);
}
```

Local SQL parity formulas:

- `total = COUNT(*) FROM items`
- `products = COUNT(*) FROM items WHERE type = 'PRODUCT'`
- `equipment = COUNT(*) FROM items WHERE type = 'EQUIPMENT'`
- `tools = COUNT(*) FROM items WHERE type = 'TOOL'`
- `kits = COUNT(*) FROM items WHERE type = 'KIT'`

Validation criteria:

- Exact integer equality for all five fields.
- Validate against at least one dataset containing all `ItemType` values.
- Cross-check dashboard derived UI total `(products + equipment + tools)` remains unchanged after migration.

## 2) `movements.getStats` parity

Server implementation source: `apps/api/src/movements/movements.service.ts#getStats`

Expected response shape:

```ts
{
  (total, purchases, returns, exits, writeoffs, thisMonth);
}
```

Local SQL parity formulas (default dashboard case, no explicit filters):

- `total = COUNT(*) FROM movements`
- `purchases = COUNT(*) FROM movements WHERE type = 'PURCHASE'`
- `returns = COUNT(*) FROM movements WHERE type = 'RETURN'`
- `exits = COUNT(*) FROM movements WHERE type = 'EXIT'`
- `writeoffs = COUNT(*) FROM movements WHERE type = 'WRITEOFF'`
- `thisMonth = COUNT(*) FROM movements WHERE date >= first_local_day_of_current_month_at_00_00_00`

Filter-aware parity notes:

- If role/date filters are introduced in local compute path, mirror API filter semantics (`createdById`, `dateFrom`, `dateTo` inclusive end-of-day behavior).
- Keep timezone behavior aligned with current server logic where `firstOfMonth` is computed in server-local time.

Validation criteria:

- Exact integer equality for all six fields.
- Run parity checks across month boundary and timezone-sensitive dates.
- Include a dataset with each `MovementType`.

## 3) `projects.getStats` parity

Server implementation source: `apps/api/src/projects/projects.service.ts#getStats`

Expected response shape:

```ts
{
  total;
}
```

Local SQL parity formula:

- `total = COUNT(*) FROM projects`

Validation criteria:

- Exact integer equality for `total`.
- Confirm no dependency on joins/role conditions for current behavior.

## 4) `adminUsers.getStats` parity

Server implementation source: `apps/api/src/users/services/admin-users.service.ts#getStats`

Expected response shape:

```ts
{
  (total, admins, active, inactive);
}
```

Local SQL parity formulas:

- `total = COUNT(*) FROM users`
- `admins = COUNT(*) FROM users WHERE role = 'ADMIN'`
- `active = COUNT(*) FROM staff WHERE work_area_id IS NOT NULL`
- `inactive = total - active`

Role/authorization constraints:

- Frontend only enables this query for admins (`enabled: isAdmin` in dashboard page).
- Any local replacement must preserve admin-only visibility guarantees.

Validation criteria:

- Exact integer equality for all four fields.
- Validate against datasets where some users have no `staff` row and/or `work_area_id` is null.
- Confirm admin-only access guard remains intact.

## 5) Dual-run and acceptance gates

Recommended dual-run strategy for all stats procedures:

1. Compute local candidate stats and fetch API stats in parallel.
2. Log per-field deltas (`local - api`) and context (`userId`, role, timestamp, filters).
3. Block cutover unless all compared integer fields match exactly for the observation window.
4. Keep rollback toggle to API-only reads until parity remains stable.

Cutover readiness signal:

- Zero mismatches in monitored datasets.
- No auth/RBAC regression for `adminUsers.getStats`.
- Deterministic month-boundary results for `movements.getStats`.
