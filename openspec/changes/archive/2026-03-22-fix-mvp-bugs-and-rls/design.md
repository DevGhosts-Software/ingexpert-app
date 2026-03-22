## Context

The MVP has three categories of bugs:

1. **Session revocation not enforced**: When admin revokes a user's access, the user stays logged in because the frontend doesn't revalidate the session state. Offline auto-login must be preserved.

2. **RLS policies too restrictive**: Current policies block `user` role from creating projects and items (should only be blocked from delete). This causes operations to fail silently in the UI.

3. **PowerSync blocks indefinitely on permission errors**: When a CRUD operation fails due to RLS/permissions, the error propagates to `uploadData()`, throwing and blocking the entire sync batch. The queue entry stays pending forever, blocking subsequent syncs. No user feedback is provided.

Current architecture:

- `connector.ts` handles PowerSync uploads via `uploadData()` → `uploadCrudEntry()`
- `fetchCredentials()` gets Supabase session token for PowerSync auth
- No queue cleanup on permission errors - errors propagate and block

## Goals / Non-Goals

**Goals:**

- Session revalidation on permission-denied events (401/403) with proper logout flow
- RLS policies that allow `user` role to INSERT projects and items (read all, delete own/exceptional)
- Non-blocking PowerSync permission errors with queue cleanup and user alerts
- Preserve offline-first, optimistic UI behavior

**Non-Goals:**

- Changing authentication mechanism (Supabase Auth remains)
- Modifying tRPC API contracts
- Adding new database tables or Prisma schema changes

## Decisions

### Decision 1: Session Revalidation Strategy

**Approach**: On PowerSync upload failure with 401/403 or permission denied (SQLSTATE 42501), trigger session revalidation before throwing.

**Implementation**:

- Add `revalidateSession()` call in `uploadData()` when `isPowerSyncPermissionDeniedError()` returns true
- The revalidation will detect the revoked session and clear local state
- Redirect to login page via existing auth state listener

**Alternative considered**: Polling-based session validation

- Rejected: Too resource-intensive, adds latency to every operation
- Chosen: Event-driven on permission error only

### Decision 2: RLS Policy Changes

**Approach**: New Supabase migration file `YYYYMMDDHHMMSS_fix_user_role_permissions.sql`

Changes:

1. `projects_insert_admin_only` → `projects_insert_authenticated` (allow any authenticated user to create projects)
2. `items_insert_authenticated` with `WITH CHECK (true)` remains - items INSERT already works
3. Add `items_update_admin_only` policy (restrict updates to admin)
4. `items_delete_admin_only` remains as-is

**Note**: Per user requirement, `user` role should only INSERT items, not edit/delete.

### Decision 3: PowerSync Error Handling with Selective Queue Cleanup

**Approach**: Queue cleanup happens ONLY for permission-denied errors. All other errors preserve queue entries indefinitely.

**Error classification**:

| Error Type                    | Examples                        | Queue Behavior                    |
| ----------------------------- | ------------------------------- | --------------------------------- |
| Permission denied             | RLS violation (42501), 401/403  | **Delete from queue**, emit alert |
| Offline/network               | No connection, timeout          | **Persist in queue**              |
| Session expired (not revoked) | Token expiry without revocation | **Persist in queue**              |
| Server errors                 | 500, 503, connection refused    | **Persist in queue**              |

**Implementation**:

```typescript
// In uploadCrudEntry(), catch permission errors:
// 1. Log the error with buildUploadFailureMessage()
// 2. Call batch.deleteRecord(entry.id) to remove from queue (PERMISSION ERRORS ONLY)
// 3. Emit alert event for UI feedback
// 4. Continue processing remaining batch entries

// For offline/network errors:
// - Do NOT delete from queue
// - Throw error to stop batch processing
// - Upload will retry when connection restored
```

**Alternative considered**: Retry with backoff

- Rejected: Permission errors won't succeed on retry without admin granting access
- Chosen: Fail fast with cleanup for permission errors, persist for recoverable errors

### Decision 4: User Alert System

**Approach**: Use a global event emitter pattern for permission errors

**Implementation**:

- Add `PermissionErrorEvent` type with table, record ID, error message
- `connector.ts` emits events on permission errors
- UI components subscribe to `permission-error` events and show toast/alert
- Uses existing `connectorDebugListeners` pattern for non-debug use

## Risks / Trade-offs

| Risk                                             | Mitigation                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| Queue cleanup loses data user thought was saved  | Show clear alert: "Operation blocked - you don't have permission. Contact admin." |
| Session revalidation breaks offline auto-login   | Test offline login flow after session revoke                                      |
| RLS change allows too much access                | INSERT-only is safe; update/delete remain admin-only                              |
| Error propagation breaks existing error handling | Wrap new behavior in try/catch, emit events rather than throw for queue cleanup   |

## Migration Plan

1. **Deploy RLS migration** via `supabase db push` or SQL editor
2. **Deploy frontend changes** (connector.ts, alert system)
3. **Test sequence**:
   - Revoke user access → verify logout redirect
   - User creates project → verify success
   - User creates item → verify success
   - User tries to delete item → verify blocked with alert
   - Permission error during sync → verify queue unblocks, alert shown

## Open Questions

1. **Alert UI**: Should we use toast notifications (non-blocking) or modal (blocking)? Preference: toast for non-critical, modal only if sync is completely stuck.

2. **Session revalidation trigger**: Should we also check on tRPC errors (403), or only PowerSync? User mentioned "bouncer" - likely both.
