# Auth Security-Equivalence Checklist

Use this checklist before relocating any `Identity/Auth` responsibility (`auth.login`, `auth.refresh`, `auth.logout`, `users.me`) away from the current API.

## A. Cryptographic and token controls

- [ ] JWT signature validation remains RS256-based with trusted JWKS source.
- [ ] JWKS key rotation and cache invalidation behavior is defined and tested.
- [ ] Access token expiry and refresh semantics match current backend behavior.
- [ ] Token revocation/logout invalidation semantics are equivalent.

## B. Identity and session semantics

- [ ] `users.me` identity resolution remains tied to validated token subject.
- [ ] Session continuity/refresh behavior matches current login + refresh flow.
- [ ] Offline continuation/revalidation behavior remains consistent with auth spec requirements.
- [ ] Failure states (expired, malformed, revoked token) produce explicit and safe outcomes.

## C. Authorization and role boundaries

- [ ] Role extraction (`ADMIN` vs `USER`) remains authoritative and tamper-resistant.
- [ ] Admin-only routes/procedures remain inaccessible to non-admin users.
- [ ] No client-provided role/identity field can override server-validated claims.
- [ ] Any relocated auth component preserves least-privilege secret handling.

## D. Operational and audit guarantees

- [ ] Auth events (login/refresh/logout/failure) are logged with correlation metadata.
- [ ] Audit trail supports incident response for auth anomalies.
- [ ] Rate limiting / abuse controls are equivalent or stronger.
- [ ] Alerting exists for abnormal auth failure patterns and token anomalies.

## E. Contract and compatibility checks

- [ ] Endpoint contracts remain aligned with `apps/api/openapi/openapi.json` (or approved successor contract source).
- [ ] Frontend transport behavior (`/trpc` normalization) remains compatible.
- [ ] Backward compatibility is verified for existing clients and sessions.
- [ ] Rollback path to current API auth is tested and documented.

## Approval gate

- [ ] Security review sign-off completed.
- [ ] Platform/architecture owner sign-off completed.
- [ ] Migration remains blocked until all checklist items are satisfied.
