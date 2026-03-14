## Why

Login currently fails in local development because the frontend posts tRPC auth calls to `http://localhost:3001/auth.login` instead of the mounted tRPC path, returning `404 Not Found`. This blocks authentication and makes the app unusable even though API and PowerSync containers are running.

## What Changes

- Define an explicit frontend tRPC URL contract so auth mutations always resolve to the API middleware path.
- Normalize `NEXT_PUBLIC_API_URL` handling in frontend provider code so a base URL without `/trpc` still targets `/trpc` at runtime.
- Align frontend environment examples/documentation with the expected tRPC endpoint shape to prevent future regressions.
- Preserve existing auth router and endpoint contracts (`/auth/login`, `/auth/refresh`, `/auth/logout`) with no backend route additions.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `auth`: Add normative requirements for frontend tRPC transport URL resolution and env configuration so login/refresh calls do not 404 due to incorrect path composition.

## Impact

- Affected code/config:
  - `apps/frontend/src/components/providers/trpc-provider.tsx`
  - `apps/frontend/.env.example` (and related docs if needed)
- Affected behavior:
  - Frontend auth mutations (`auth.login`, `auth.refresh`, `auth.logout`) route correctly through API tRPC middleware.
- No Prisma schema changes.
- No new API routes; existing auth router in `apps/api/src/auth/auth.router.ts` remains the contract source.
