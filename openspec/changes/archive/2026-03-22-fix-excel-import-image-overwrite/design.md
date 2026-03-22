## Context

The Excel inventory import functionality in `apps/frontend/src/features/inventory/components/import-excel-dialog.tsx` allows users to bulk update stock and item metadata. The current implementation uses local PowerSync transactions to handle the import. When an item already exists (matched by its `code`), the system executes an `UPDATE` SQL statement.

Currently, this `UPDATE` statement includes the `image_url` field. However, because Excel files do not contain image data, the imported `item` object has an empty `imageUrl` property, which is then used to overwrite the existing `image_url` in the database.

## Goals / Non-Goals

**Goals:**

- Prevent the loss of existing item and kit images during the Excel import process.
- Implement a "partial update" behavior for the `items` table during import, specifically for the `image_url` field.
- Ensure the fix applies to both individual items and kits.

**Non-Goals:**

- Modifying the Excel file format or headers.
- Changing how stock is calculated or injected into the movement ledger.
- Altering the UI of the import dialog.

## Decisions

### 1. Remove `image_url` from `UPDATE` Statements

Instead of modifying the `ParsedInventoryImportRow` type or the parsing logic, we will modify the SQL `UPDATE` statements in the `handleImport` function.

By removing `image_url = ?` from the `SET` clause and its corresponding parameter from the arguments list, the database will leave the existing `image_url` value untouched.

### 2. Preserve `image_url` in `INSERT` Statements

For NEW items (those that don't exist yet), we will keep the `image_url` in the `INSERT` statement (setting it to an empty string) to ensure the table structure is respected and the field is initialized.

## Risks / Trade-offs

- **[Risk]**: Users might expect that "emptying" a cell in Excel should clear the field in the database.
- **[Mitigation]**: This is already a known limitation/behavior for most fields in this import. Given that `image_url` is never present in the Excel file, preserving it is the only way to avoid unconditional data loss.
