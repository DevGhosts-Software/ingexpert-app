## Context

The movement form allows adding items including "kits" which should expand into their component items. When a kit is added via `handleAddItem`, it looks up the kit's components in `kitComponentsByKitId` using `item.componentId` as the key. If the lookup returns an empty array, the error "El kit no tiene componentes configurados" is shown.

## Goals / Non-Goals

**Goals:**

- Identify why `kitComponentsByKitId.get(item.componentId)` returns empty for kits that have components
- Fix the bug so kit expansion works correctly

**Non-Goals:**

- Major refactoring of the kit or movement systems
- Adding new features to kit management

## Decisions

### 1. Query Analysis

The `kitDetailsQuery` (lines 206-218) joins `kit_details` with `items` via `kd.item_id = component.id`. The query selects `kd.kit_id` as the key.

**Potential issue**: The query does NOT filter by `kit_id`. It returns ALL kit-component relationships. This is correct for building the map, but the map key must match what `handleAddItem` passes as `item.componentId`.

### 2. Map Building Analysis

The `kitComponentsByKitId` useMemo uses `row.kit_id` as the map key. This means the map is keyed by kit ID.

**Key question**: When a KIT item is passed to `handleAddItem`, is `item.componentId` the kit's ID?

### 3. Debugging Approach

Step 1: Verify query data

- Add console.log to `kitDetailsQuery.data` to confirm query returns results
- Check if `kit_id` values in results match kit IDs in the system

Step 2: Verify map building

- Log `kitComponentsByKitId` to confirm map is populated correctly
- Check if specific kit ID exists as a key

Step 3: Verify item data

- Log `item.componentId` when `item.type === 'KIT'` to confirm it matches the map key

### 4. Likely Fix Locations

**If map is empty/undefined**: Issue with `kitDetailsQuery` or the useMemo dependency

- Verify `kitDetailsQuery.data` is populated
- Check `useMemo` dependency array `[kitDetailsQuery.data]`

**If map has entries but lookup fails**: Key mismatch

- `item.componentId` may not be the kit's actual ID
- May need to look up kit's ID differently (e.g., from `item.id` not `item.componentId`)

**If map lookup succeeds but components array is empty**: Query issue

- The `kit_details` table may not have entries for this kit
- Or sync hasn't populated the data yet

## Risks / Trade-offs

- This is a local state bug - no API or sync changes needed if the underlying data exists
- If the issue is sync-related (PowerSync not yet synced), the fix is "wait for sync" - not a code issue
