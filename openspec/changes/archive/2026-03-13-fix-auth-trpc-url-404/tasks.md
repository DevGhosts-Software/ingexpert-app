## 1. Normalize frontend tRPC URL resolution

- [x] 1.1 Update `apps/frontend/src/components/providers/trpc-provider.tsx` to derive a canonical tRPC endpoint from `NEXT_PUBLIC_API_URL` and append `/trpc` when the suffix is missing.
- [x] 1.2 Ensure `apps/frontend/src/components/providers/trpc-provider.tsx` preserves existing behavior when `NEXT_PUBLIC_API_URL` already includes `/trpc`.

## 2. Align frontend environment documentation

- [x] 2.1 Update `apps/frontend/.env.example` to document valid `NEXT_PUBLIC_API_URL` inputs and clarify runtime resolution to the tRPC endpoint.
- [x] 2.2 Verify `apps/frontend/.env` local developer setup uses a value compatible with the normalized tRPC URL contract.

## 3. Validate auth login path behavior

- [x] 3.1 Start app stack and verify login requests route through `/trpc` (not root `/auth.login`) and no longer return 404 for auth mutations.
- [x] 3.2 Run `pnpm check` from repository root to confirm formatting, linting, type-checking, and frontend build remain healthy.
