## Why

The Excel inventory import process currently suffers from a critical data-loss bug where existing item images are overwritten with empty values. This happens because the import logic performs a full update on existing items but doesn't handle the fact that Excel files do not contain image data, resulting in `image_url` being reset to an empty string.

## What Changes

- **Partial Updates for Import**: Refactor the database update logic within the Excel import transaction to ensure it only updates fields provided by the Excel file (name, location, unit, type) while strictly preserving existing fields not present in the import (specifically `image_url`).
- **Preservation of Existing Assets**: Ensure that items and kits that already have images in the database do not lose them when their stock or other metadata is updated via Excel import.

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- `inventory`: Update the import requirement to enforce partial updates that preserve existing metadata (like images) when updating items via Excel.

## Impact

- `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx`: The local PowerSync transaction logic for both items and kits will be modified to remove `image_url` from the `UPDATE` statements.
