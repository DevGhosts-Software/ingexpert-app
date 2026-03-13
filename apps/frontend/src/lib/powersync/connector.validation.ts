import type { CrudEntry } from '@powersync/web';
import { UpdateType } from '@powersync/web';
import { shouldSkipCrudUpload } from './connector';

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
}
