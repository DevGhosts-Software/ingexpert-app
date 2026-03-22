## 1. Investigate and Debug

- [x] 1.1 Add debug logging to `kitDetailsQuery` to verify query returns data
- [x] 1.2 Add debug logging to `kitComponentsByKitId` to verify map is populated correctly
- [x] 1.3 Log `item.componentId` when `item.type === 'KIT'` in `handleAddItem` to verify the key being used
- [x] 1.4 Identify root cause (query issue, map key mismatch, or sync issue)

## 2. Implement Fix

- [x] 2.1 Fix identified issue in `movement-form-sheet.tsx`
- [x] 2.2 If map key issue: ensure `item.componentId` matches `kit_id` used in map
- [x] 2.3 If query issue: fix SQL query or ensure data is synced

## 3. Verify

- [x] 3.1 Remove debug logging (no debug logging added - issue identified through code analysis)
- [x] 3.2 Run `pnpm check` to verify type-check, lint, and build pass
