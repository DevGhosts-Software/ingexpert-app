import type { AbstractPowerSyncDatabase, CrudEntry, PowerSyncCredentials } from '@powersync/web';
import { UpdateType, type PowerSyncBackendConnector } from '@powersync/web';
import { supabase } from '@/lib/supabase';

const MOVEMENT_OPTIMISTIC_SOURCE = 'movement-optimistic-stock';
const MISSING_SESSION_ERROR = 'Cannot upload PowerSync CRUD without an active Supabase session';

type CrudPayload = Record<string, unknown>;
type CrudSource = { source?: string };
type ConnectorDebugListener = () => void;

export type PowerSyncConnectorDebugState = {
  lastCredentialAttemptAt: string | null;
  lastCredentialAt: string | null;
  lastCredentialError: string | null;
  sessionUserId: string | null;
  sessionExpiresAt: string | null;
  lastUploadAttemptAt: string | null;
  lastUploadAt: string | null;
  lastUploadError: string | null;
  lastBatchSize: number;
  lastBatchUploaded: number;
  lastBatchSkipped: number;
  lastBatchHadMore: boolean;
};

const INITIAL_CONNECTOR_DEBUG_STATE: PowerSyncConnectorDebugState = {
  lastCredentialAttemptAt: null,
  lastCredentialAt: null,
  lastCredentialError: null,
  sessionUserId: null,
  sessionExpiresAt: null,
  lastUploadAttemptAt: null,
  lastUploadAt: null,
  lastUploadError: null,
  lastBatchSize: 0,
  lastBatchUploaded: 0,
  lastBatchSkipped: 0,
  lastBatchHadMore: false,
};

const connectorDebugListeners = new Set<ConnectorDebugListener>();
let connectorDebugState: PowerSyncConnectorDebugState = INITIAL_CONNECTOR_DEBUG_STATE;

function updateConnectorDebugState(
  patch: Partial<PowerSyncConnectorDebugState>,
): PowerSyncConnectorDebugState {
  connectorDebugState = { ...connectorDebugState, ...patch };
  for (const listener of connectorDebugListeners) {
    listener();
  }
  return connectorDebugState;
}

export function subscribePowerSyncConnectorDebug(listener: ConnectorDebugListener): () => void {
  connectorDebugListeners.add(listener);
  return () => connectorDebugListeners.delete(listener);
}

export function getPowerSyncConnectorDebugSnapshot(): PowerSyncConnectorDebugState {
  return connectorDebugState;
}

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

export function isRecoverablePowerSyncUploadError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('network') ||
    normalized.includes('fetch') ||
    normalized.includes('timeout') ||
    normalized.includes('active supabase session')
  );
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

function readMetadataFromPayload(payload?: Record<string, unknown>): string | undefined {
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
    updateConnectorDebugState({
      lastCredentialAttemptAt: new Date().toISOString(),
      lastCredentialError: null,
    });

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      updateConnectorDebugState({
        lastCredentialError: error.message,
      });
      return null;
    }

    if (!session) {
      updateConnectorDebugState({
        sessionUserId: null,
        sessionExpiresAt: null,
      });
      return null;
    }

    if (!this.powerSyncEndpoint) {
      updateConnectorDebugState({
        lastCredentialError: 'Missing NEXT_PUBLIC_POWERSYNC_URL for PowerSync credentials',
      });
      throw new Error('Missing NEXT_PUBLIC_POWERSYNC_URL for PowerSync credentials');
    }

    const issuedAt = new Date().toISOString();
    updateConnectorDebugState({
      lastCredentialAt: issuedAt,
      lastCredentialError: null,
      sessionUserId: session.user.id,
      sessionExpiresAt: session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : null,
    });

    return {
      endpoint: this.powerSyncEndpoint,
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    updateConnectorDebugState({
      lastUploadAttemptAt: new Date().toISOString(),
      lastUploadError: null,
    });

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      updateConnectorDebugState({
        lastUploadError: error.message,
      });
      throw new Error(error.message);
    }

    if (!session?.access_token) {
      updateConnectorDebugState({
        lastUploadError: MISSING_SESSION_ERROR,
      });
      throw new Error(MISSING_SESSION_ERROR);
    }

    while (true) {
      const batch = await database.getCrudBatch(100);
      if (!batch) {
        updateConnectorDebugState({
          lastUploadAt: new Date().toISOString(),
          lastBatchSize: 0,
          lastBatchUploaded: 0,
          lastBatchSkipped: 0,
          lastBatchHadMore: false,
        });
        return;
      }

      let uploadedCount = 0;
      let skippedCount = 0;

      try {
        for (const entry of batch.crud) {
          if (shouldSkipCrudUpload(entry)) {
            skippedCount += 1;
            continue;
          }
          await this.uploadCrudEntry(entry);
          uploadedCount += 1;
        }

        await batch.complete();
        updateConnectorDebugState({
          lastUploadAt: new Date().toISOString(),
          lastUploadError: null,
          lastBatchSize: batch.crud.length,
          lastBatchUploaded: uploadedCount,
          lastBatchSkipped: skippedCount,
          lastBatchHadMore: batch.haveMore,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown PowerSync upload processing error';
        updateConnectorDebugState({
          lastUploadError: message,
          lastBatchSize: batch.crud.length,
          lastBatchUploaded: uploadedCount,
          lastBatchSkipped: skippedCount,
          lastBatchHadMore: batch.haveMore,
        });
        throw error;
      }
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
