## 1. Supabase RLS Migration

- [x] 1.1 Create new migration file `packages/database/supabase/migrations/20260321000001_fix_user_role_permissions.sql`
- [x] 1.2 Modify `projects_insert_admin_only` policy to allow authenticated INSERT (change `public.is_admin()` to `true`)
- [x] 1.3 Add `items_update_admin_only` policy restricting UPDATE to admin only
- [x] 1.4 Keep `items_delete_admin_only` as-is (admin-only)
- [x] 1.5 Keep `items_insert_authenticated` as-is (already allows authenticated INSERT)
- [x] 1.6 Add verification queries for user role INSERT on projects and items
- [ ] 1.7 Run `supabase db push` or apply via SQL editor to test migration

## 2. PowerSync Connector - Selective Queue Cleanup

- [x] 2.1 Modify `uploadCrudEntry()` to check `isPowerSyncPermissionDeniedError()` for each upload failure
- [x] 2.2 If permission error: delete from `ps_crud` table, emit alert event, continue to next entry
- [x] 2.3 If non-permission error (offline, network, 5xx): throw error to stop batch, DO NOT delete from queue
- [x] 2.4 Wrap the delete call in try/catch to handle potential errors gracefully
- [x] 2.5 Update `isRecoverablePowerSyncUploadError()` to clarify offline/network errors remain recoverable but persistent
- [x] 2.6 Run `pnpm check` to verify TypeScript compiles

## 3. Session Revalidation on Permission Errors

- [x] 3.1 Call `revalidateSession()` from `uploadData()` when permission error detected (instead of fetchCredentials)
- [x] 3.2 Create `revalidateSession()` helper that calls `supabase.auth.getSession()` to check current state
- [x] 3.3 Emit `sessionRevalidationListeners` event on invalid session (UI handles logout/redirect)
- [x] 3.4 Verify offline auto-login still works after session revalidation changes
- [x] 3.5 Run `pnpm check` to verify TypeScript compiles

## 4. User Alert System for Permission Errors

- [x] 4.1 Add `PermissionErrorEvent` type to `connector.ts` with table, recordId, errorMessage fields
- [x] 4.2 Create `permissionErrorListeners` Set with `subscribePermissionError()` function
- [x] 4.3 Emit events when permission errors occur during upload
- [x] 4.4 Toast/alert already exists via Sonner, used in PowerSyncProvider subscription
- [x] 4.5 Wire up permission error subscription in PowerSyncProvider to show toasts
- [x] 4.6 Run `pnpm check` to verify TypeScript compiles

## 5. Verification and Testing

- [ ] 5.1 Test: User with `user` role creates project → succeeds
- [ ] 5.2 Test: User with `user` role updates project → blocked with alert
- [ ] 5.3 Test: User with `user` role deletes project → blocked with alert
- [ ] 5.4 Test: User with `user` role creates item → succeeds
- [ ] 5.5 Test: User with `user` role updates item → blocked with alert
- [ ] 5.6 Test: User with `user` role deletes item → blocked with alert
- [ ] 5.7 Test: Admin revokes user access → user is logged out and redirected to login
- [ ] 5.8 Test: Offline auto-login still works after all changes
- [ ] 5.9 Test: Permission error during sync → queue unblocks, alert shown, remaining items sync
- [ ] 5.10 Test: Go offline, queue entries persist → come back online, entries sync successfully
- [ ] 5.11 Test: Server error during sync → queue entries persist, no cleanup
- [x] 5.12 Run `pnpm check` (format → lint → type-check → Next.js build) ✓
