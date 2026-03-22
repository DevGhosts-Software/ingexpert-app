## Why

The MVP has several critical bugs affecting user experience and security: session revocation isn't properly validating/logging out users, RLS policies incorrectly block regular users from creating projects and items, and PowerSync permission errors block the entire sync queue indefinitely without user feedback.

## What Changes

1. **Session revocation validation**: After access revocation, properly logout user and redirect to login page. Must preserve offline auto-login functionality.
2. **RLS for projects**: Allow authenticated users with `user` role to INSERT projects (currently blocked for non-admins).
3. **Better auth bouncer**: Ensure revoked sessions cannot bypass RLS via cached PowerSync credentials - better validation flow.
4. **RLS for items**: Allow authenticated users with `user` role to INSERT items. Restrict UPDATE/DELETE to admin only.
5. **PowerSync error handling**: Detect permission errors during upload, delete the blocking CRUD entry from queue, and show user alert. Non-blocking feedback instead of indefinite blocking. Queue entries that fail due to non-permission causes (offline, network errors, server errors) MUST persist in queue until successfully synced.
6. **Queue cleanup scope**: Only permission-denied errors (RLS violations, 401/403 from revoked sessions) trigger queue cleanup. The following cases preserve queue entries indefinitely:
   - **Offline/network errors**: Queue persists until connection restored
   - **Session expiry (not revocation)**: Queue persists, will resolve on session refresh
   - **Server errors (5xx)**: Queue persists, transient issues resolve on retry
   - **Data validation errors (4xx)**: Queue persists, requires data fix or admin intervention

## Capabilities

### New Capabilities

- `powersync-error-remediation`: Detect PowerSync upload permission errors (RLS violations, 401/403), delete only those blocking CRUD entries from local queue, and surface user-friendly alerts. Queue entries failing due to offline/network/server errors persist indefinitely until resolved.
- `session-revalidation`: Proper session state revalidation after token revocation events with login page redirect while preserving offline auto-login.

### Modified Capabilities

- `projects-rls`: Change RLS policy to allow `user` role INSERT (currently admin-only).
- `items-rls`: Change RLS policy to allow `user` role INSERT only (UPDATE/DELETE remain admin-only).

## Impact

- **Supabase RLS migrations**: New migration file for RLS policy changes
- **PowerSync connector**: Modified `connector.ts` for selective queue cleanup (permission errors only, not offline/network errors)
- **Auth/bouncer logic**: Changes to session validation on permission-denied scenarios
- **User-facing**: Alerts shown when operations are rejected due to permissions
