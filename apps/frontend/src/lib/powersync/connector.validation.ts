import type { CrudEntry } from '@powersync/web';
import { UpdateType } from '@powersync/web';
import {
  isPowerSyncPermissionDeniedError,
  isRecoverablePowerSyncUploadError,
  shouldSkipCrudUpload,
} from './connector';

function asCrudEntry(entry: Partial<CrudEntry>): CrudEntry {
  return entry as CrudEntry;
}

export function validateConnectorSkipRules(): void {
  const optimisticItemsUpdate = asCrudEntry({
    table: 'items',
    op: UpdateType.PATCH,
    id: 'item-1',
    opData: { stock: 9, _metadata: JSON.stringify({ source: 'movement-optimistic-stock' }) },
  });

  const adminItemsUpdate = asCrudEntry({
    table: 'items',
    op: UpdateType.PATCH,
    id: 'item-2',
    opData: { name: 'Taladro SDS', stock: 20 },
  });

  const movementInsert = asCrudEntry({
    table: 'movements',
    op: UpdateType.PUT,
    id: 'movement-1',
    opData: { type: 'EXIT' },
  });

  if (!shouldSkipCrudUpload(optimisticItemsUpdate)) {
    throw new Error('Expected optimistic movement-side items update to be skipped');
  }

  if (shouldSkipCrudUpload(adminItemsUpdate)) {
    throw new Error('Expected canonical admin items update to be uploaded');
  }

  if (shouldSkipCrudUpload(movementInsert)) {
    throw new Error('Expected movement inserts to be uploaded');
  }

  if (!isRecoverablePowerSyncUploadError('Network request failed while uploading movement batch')) {
    throw new Error('Expected network upload failures to be treated as recoverable');
  }

  if (
    !isRecoverablePowerSyncUploadError(
      'Cannot upload PowerSync CRUD without an active Supabase session',
    )
  ) {
    throw new Error('Expected missing-session upload failures to be treated as recoverable');
  }

  if (
    isRecoverablePowerSyncUploadError(
      'PowerSync upload failed for movements/1: invalid input syntax for type uuid',
    )
  ) {
    throw new Error('Expected data-shape upload failures to be treated as non-recoverable');
  }

  if (
    !isRecoverablePowerSyncUploadError(
      'PowerSync upload failed for movements/1: duplicate key value violates unique constraint "movements_pkey"',
    )
  ) {
    throw new Error('Expected duplicate-key replay failures to be treated as recoverable');
  }

  if (
    !isPowerSyncPermissionDeniedError({
      code: '42501',
      message: 'permission denied for schema public',
    })
  ) {
    throw new Error('Expected SQLSTATE 42501 permission errors to be detected');
  }
}
