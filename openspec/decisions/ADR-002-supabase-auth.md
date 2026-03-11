# ADR-002: Supabase Auth with RS256 JWKS

## Status
Accepted

## Context
Ingexpert requires authentication with Admin-Only user registration (no public sign-up). User lifecycle management (create, disable) must be performed by an administrator. The system also needs JWTs that can be validated by NestJS without a shared secret.

Options considered:
- **Custom JWT with a shared HS256 secret** — simple, but requires securely distributing the signing secret to every service, and provides no managed user store.
- **Passport.js + local strategy + custom user table** — full control but significant implementation burden (password hashing, token refresh, session management, account lifecycle).
- **Supabase Auth** — managed auth with an Admin API for server-side user creation/deletion, RS256 asymmetric signing (JWKS endpoint), and automatic PostgreSQL `auth.users` row creation with a trigger-based sync to the app's `User` table.

## Decision
Use **Supabase Auth** as the identity provider.

- JWTs are signed with **RS256** and validated in NestJS via the Supabase **JWKS endpoint** — no shared secret is distributed.
- User creation and deactivation go through the **Supabase Admin API** (`supabase.auth.admin.*`), called exclusively from `apps/api`.
- A **PostgreSQL trigger** on `auth.users` automatically creates a corresponding row in the application's `User` table on first login, so the API never needs to `INSERT` into `User` manually.
- Public registration is disabled at the Supabase project level.

## Consequences
- **Easier:** No custom password hashing, JWT signing, or token refresh logic in the application.
- **Easier:** RS256 JWKS validation is stateless — NestJS fetches the public key once and caches it; no shared secret to rotate.
- **Easier:** Admin API centralises user lifecycle; the frontend never interacts with auth management directly.
- **Harder:** The application depends on Supabase as an external service — local development requires either a local Supabase instance (`supabase start`) or a project URL/key in `.env`.
- **Harder:** The trigger-based `User` row sync means that if the trigger fails, the API will have an orphaned `auth.users` entry with no corresponding app-level `User` row.
