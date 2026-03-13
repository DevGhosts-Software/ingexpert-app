## Context

The API exposes tRPC middleware at `/trpc` (`apps/api/src/main.ts`), while frontend auth calls are currently resolving to `/auth.login` when `NEXT_PUBLIC_API_URL` is configured as `http://localhost:3001`. This path mismatch causes repeated 404 responses and blocks login even when backend auth procedures are healthy.

The auth backend contract itself is already present in `apps/api/src/auth/auth.router.ts` and should remain unchanged. The issue is transport URL composition on the frontend.

## Goals / Non-Goals

**Goals:**

- Ensure frontend tRPC auth procedures always target the API middleware path.
- Make frontend environment configuration resilient when `NEXT_PUBLIC_API_URL` is provided as a base origin (without `/trpc`).
- Prevent recurrence by documenting the expected URL behavior in env examples and specs.

**Non-Goals:**

- No new auth routes or API contract shape changes.
- No Prisma schema changes or auth business-logic changes.
- No changes to Supabase credential flow beyond transport routing correctness.

## Decisions

1. **Normalize tRPC endpoint in frontend provider**
   - Compute a canonical tRPC URL from `NEXT_PUBLIC_API_URL`, appending `/trpc` when missing.
   - Rationale: Accepts both developer-friendly base URLs and explicit full tRPC URLs without breaking requests.

2. **Keep backend router unchanged**
   - Retain existing auth procedures and middleware mount at `/trpc`.
   - Rationale: Backend is functioning and already aligned with architecture conventions.

3. **Align env examples with runtime behavior**
   - Update `.env.example` guidance to explicitly communicate expected tRPC resolution.
   - Rationale: Removes ambiguity that caused the regression.

## Risks / Trade-offs

- **[Risk] Over-normalization could produce duplicate path suffixes** → **Mitigation:** Use strict suffix check before appending `/trpc`.
- **[Risk] Existing environments might already include `/trpc`** → **Mitigation:** Preserve compatibility by treating URLs with `/trpc` as already canonical.
- **[Trade-off] Frontend adds small URL-resolution logic** → **Mitigation:** Keep logic centralized in `TRPCProvider` to avoid drift.
