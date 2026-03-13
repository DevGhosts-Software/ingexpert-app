import type { AbstractPowerSyncDatabase, CrudEntry, PowerSyncCredentials } from '@powersync/web';
import { UpdateType, type PowerSyncBackendConnector } from '@powersync/web';
import { supabase } from '@/lib/supabase';

const MOVEMENT_OPTIMISTIC_SOURCE = 'movement-optimistic-stock';

type CrudPayload = Record<string, unknown>;
type CrudSource = { source?: string };

export function isMovementOptimisticItemsUpdate(entry: CrudEntry): boolean {
  const isItemsTable = entry.table === 'Item' || entry.table === 'items';
  if (!isItemsTable || entry.op !== UpdateType.PATCH) {
    return false;
  }

  const entryMetadata = parseCrudMetadata(entry.metadata);
  if (entryMetadata?.source === MOVEMENT_OPTIMISTIC_SOURCE) {
    return true;
  }

  const opMetadata = parseCrudMetadata(readMetadataFromPayload(entry.opData));
  return opMetadata?.source === MOVEMENT_OPTIMISTIC_SOURCE;
}

export function shouldSkipCrudUpload(entry: CrudEntry): boolean {
  return isMovementOptimisticItemsUpdate(entry);
}

function parseCrudMetadata(rawMetadata: string | undefined): CrudSource | null {
  if (!rawMetadata) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawMetadata) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as CrudSource;
    }
  } catch {
    // Metadata may be plain text; ignore if it's not valid JSON.
  }

  return null;
}

function readMetadataFromPayload(payload?: Record<string, any>): string | undefined {
  const metadata = payload?._metadata;
  return typeof metadata === 'string' ? metadata : undefined;
}

function omitLocalMetadata(payload: CrudPayload): CrudPayload {
  const { _metadata, ...rest } = payload;
  return rest;
}

export class IngexpertPowerSyncBackendConnector implements PowerSyncBackendConnector {
  private readonly powerSyncEndpoint = process.env.NEXT_PUBLIC_POWERSYNC_URL;

  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    if (!this.powerSyncEndpoint) {
      throw new Error('Missing NEXT_PUBLIC_POWERSYNC_URL for PowerSync credentials');
    }

    return {
      endpoint: this.powerSyncEndpoint,
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Cannot upload PowerSync CRUD without an active Supabase session');
    }

    while (true) {
      const batch = await database.getCrudBatch(100);
      if (!batch) {
        return;
      }

      for (const entry of batch.crud) {
        if (shouldSkipCrudUpload(entry)) {
          continue;
        }
        await this.uploadCrudEntry(entry);
      }

      await batch.complete();
      if (!batch.haveMore) {
        return;
      }
    }
  }

  private async uploadCrudEntry(entry: CrudEntry): Promise<void> {
    if (entry.op === UpdateType.DELETE) {
      throw new Error(`DELETE replay is not mapped for table ${entry.table}`);
    }

    const payload = omitLocalMetadata(entry.opData ?? {});

    if (entry.table === 'Movement' || entry.table === 'movements') {
      if (entry.op !== UpdateType.PUT) {
        throw new Error(`Operation ${entry.op} is not supported for table ${entry.table}`);
      }

      const { error } = await supabase.from('movements').insert({ id: entry.id, ...payload });
      if (error) {
        throw new Error(`PowerSync upload failed for movements/${entry.id}: ${error.message}`);
      }
      return;
    }

    if (entry.table === 'MovementDetail' || entry.table === 'movement_details') {
      if (entry.op !== UpdateType.PUT) {
        throw new Error(`Operation ${entry.op} is not supported for table ${entry.table}`);
      }

      const { error } = await supabase
        .from('movement_details')
        .insert({ id: entry.id, ...payload });
      if (error) {
        throw new Error(
          `PowerSync upload failed for movement_details/${entry.id}: ${error.message}`,
        );
      }
      return;
    }

    if (entry.table === 'Item' || entry.table === 'items') {
      if (entry.op === UpdateType.PUT) {
        const { error } = await supabase.from('items').insert({ id: entry.id, ...payload });
        if (error) {
          throw new Error(`PowerSync upload failed for items/${entry.id}: ${error.message}`);
        }
        return;
      }

      const { error } = await supabase.from('items').update(payload).eq('id', entry.id);
      if (error) {
        throw new Error(`PowerSync upload failed for items/${entry.id}: ${error.message}`);
      }
      return;
    }

    if (entry.table === 'Project' || entry.table === 'projects') {
      if (entry.op === UpdateType.PUT) {
        const { error } = await supabase.from('projects').insert({ id: entry.id, ...payload });
        if (error) {
          throw new Error(`PowerSync upload failed for projects/${entry.id}: ${error.message}`);
        }
        return;
      }

      const { error } = await supabase.from('projects').update(payload).eq('id', entry.id);
      if (error) {
        throw new Error(`PowerSync upload failed for projects/${entry.id}: ${error.message}`);
      }
      return;
    }

    throw new Error(`Unsupported CRUD table "${entry.table}" in PowerSync uploadData`);
  }
}
