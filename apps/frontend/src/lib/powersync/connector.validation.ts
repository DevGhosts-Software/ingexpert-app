import type { CrudEntry } from '@powersync/web';
import { UpdateType } from '@powersync/web';
import {
  buildUploadFailureMessage,
  isPowerSyncPermissionDeniedError,
  isRecoverablePowerSyncUploadError,
  normalizeUploadCrudTable,
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

  if (normalizeUploadCrudTable('kit_details') !== 'kit_details') {
    throw new Error('Expected kit_details CRUD table name to be supported');
  }

  if (normalizeUploadCrudTable('KitDetail') !== 'kit_details') {
    throw new Error('Expected KitDetail CRUD table alias to be supported');
  }

  if (normalizeUploadCrudTable('kit_detail') !== null) {
    throw new Error('Expected invalid kit detail table aliases to remain unsupported');
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
      'PowerSync upload failed for kit_details/1: duplicate key value violates unique constraint "kit_details_pkey"',
    )
  ) {
    throw new Error('Expected duplicate-key replay failures to be treated as recoverable');
  }

  const permissionErrorMessage = buildUploadFailureMessage('kit_details', 'kit-detail-1', {
    code: '42501',
    message: 'permission denied for table kit_details',
  });
  if (
    !permissionErrorMessage.includes('PowerSync upload failed for kit_details/kit-detail-1:') ||
    !permissionErrorMessage.includes('Permission remediation required:')
  ) {
    throw new Error(
      'Expected kit_details permission failures to preserve actionable upload context',
    );
  }

  const genericErrorMessage = buildUploadFailureMessage('kit_details', 'kit-detail-2', {
    message: 'new row violates row-level security policy for table "kit_details"',
  });
  if (
    genericErrorMessage !==
    'PowerSync upload failed for kit_details/kit-detail-2: new row violates row-level security policy for table "kit_details"'
  ) {
    throw new Error(
      'Expected non-permission kit_details failures to preserve the original message shape',
    );
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
