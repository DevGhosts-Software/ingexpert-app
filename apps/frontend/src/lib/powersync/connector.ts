import type { AbstractPowerSyncDatabase, CrudEntry, PowerSyncCredentials } from '@powersync/web';
import { UpdateType, type PowerSyncBackendConnector } from '@powersync/web';
import { supabase } from '@/lib/supabase';

const MOVEMENT_OPTIMISTIC_SOURCE = 'movement-optimistic-stock';
const MISSING_SESSION_ERROR = 'Cannot upload PowerSync CRUD without an active Supabase session';
const POWERSYNC_PERMISSION_REMEDIATION =
  'Permission remediation required: run packages/database/supabase/migrations/03_powersync-upload-permissions.sql in your Supabase SQL editor, then re-run the verification queries in that file.';

type CrudPayload = Record<string, unknown>;
type CrudSource = { source?: string };
type ConnectorDebugListener = () => void;
export type SupabaseUploadError = {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

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
    normalized.includes('active supabase session') ||
    normalized.includes('permission denied for schema') ||
    normalized.includes('permission denied for table') ||
    normalized.includes('duplicate key value violates unique constraint')
  );
}

export function isPowerSyncPermissionDeniedError(error: SupabaseUploadError): boolean {
  const normalizedMessage = error.message.toLowerCase();
  const normalizedDetails = (error.details ?? '').toLowerCase();
  const normalizedHint = (error.hint ?? '').toLowerCase();
  return (
    error.code === '42501' ||
    normalizedMessage.includes('permission denied for schema') ||
    normalizedMessage.includes('permission denied for table') ||
    normalizedDetails.includes('permission denied') ||
    normalizedHint.includes('permission denied')
  );
}

export function buildUploadFailureMessage(
  table: string,
  id: string,
  error: SupabaseUploadError,
): string {
  const baseMessage = `PowerSync upload failed for ${table}/${id}: ${error.message}`;
  if (!isPowerSyncPermissionDeniedError(error)) {
    return baseMessage;
  }
  return `${baseMessage} ${POWERSYNC_PERMISSION_REMEDIATION}`;
}

function isDuplicateKeyError(error: SupabaseUploadError): boolean {
  const normalizedMessage = error.message.toLowerCase();
  return (
    error.code === '23505' ||
    normalizedMessage.includes('duplicate key value violates unique constraint')
  );
}

export function normalizeUploadCrudTable(
  table: string,
): 'movements' | 'movement_details' | 'items' | 'projects' | 'kit_details' | 'users' | null {
  if (table === 'Movement' || table === 'movements') {
    return 'movements';
  }

  if (table === 'MovementDetail' || table === 'movement_details') {
    return 'movement_details';
  }

  if (table === 'Item' || table === 'items') {
    return 'items';
  }

  if (table === 'Project' || table === 'projects') {
    return 'projects';
  }

  if (table === 'KitDetail' || table === 'kit_details') {
    return 'kit_details';
  }

  if (table === 'User' || table === 'users') {
    return 'users';
  }

  return null;
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
    const payload = omitLocalMetadata(entry.opData ?? {});
    const uploadTable = normalizeUploadCrudTable(entry.table);

    if (!uploadTable) {
      throw new Error(`Unsupported CRUD table "${entry.table}" in PowerSync uploadData`);
    }

    if (uploadTable === 'movements') {
      if (entry.op !== UpdateType.PUT) {
        throw new Error(`Operation ${entry.op} is not supported for table ${entry.table}`);
      }

      const movementPayload = { ...payload };
      const rawType = movementPayload.type;
      if (typeof rawType === 'string') {
        const normalizedType = rawType.trim().toLowerCase();
        if (normalizedType === 'ajuste_positivo') {
          movementPayload.type = 'PURCHASE';
          if (
            movementPayload.destination === null ||
            movementPayload.destination === undefined ||
            movementPayload.destination === ''
          ) {
            movementPayload.destination = '__stock_adjustment__';
          }
        } else if (normalizedType === 'ajuste_negativo') {
          movementPayload.type = 'WRITEOFF';
          if (
            movementPayload.destination === null ||
            movementPayload.destination === undefined ||
            movementPayload.destination === ''
          ) {
            movementPayload.destination = '__stock_adjustment__';
          }
        }
      }

      const { error } = await supabase
        .from('movements')
        .upsert({ id: entry.id, ...movementPayload }, { onConflict: 'id', ignoreDuplicates: true });
      if (error) {
        if (isDuplicateKeyError(error)) {
          return;
        }
        throw new Error(buildUploadFailureMessage('movements', entry.id, error));
      }
      return;
    }

    if (uploadTable === 'movement_details') {
      if (entry.op !== UpdateType.PUT) {
        throw new Error(`Operation ${entry.op} is not supported for table ${entry.table}`);
      }

      const { error } = await supabase
        .from('movement_details')
        .upsert({ id: entry.id, ...payload }, { onConflict: 'id', ignoreDuplicates: true });
      if (error) {
        if (isDuplicateKeyError(error)) {
          return;
        }
        throw new Error(buildUploadFailureMessage('movement_details', entry.id, error));
      }
      return;
    }

    if (uploadTable === 'items') {
      if (entry.op === UpdateType.PUT) {
        const { error } = await supabase
          .from('items')
          .upsert({ id: entry.id, ...payload }, { onConflict: 'id', ignoreDuplicates: true });
        if (error) {
          if (isDuplicateKeyError(error)) {
            return;
          }
          throw new Error(buildUploadFailureMessage('items', entry.id, error));
        }
        return;
      }

      if (entry.op === UpdateType.PATCH) {
        const { error } = await supabase.from('items').update(payload).eq('id', entry.id);
        if (error) {
          throw new Error(buildUploadFailureMessage('items', entry.id, error));
        }
        return;
      }

      if (entry.op === UpdateType.DELETE) {
        const { error } = await supabase.from('items').delete().eq('id', entry.id);
        if (error) {
          throw new Error(buildUploadFailureMessage('items', entry.id, error));
        }
        return;
      }

      throw new Error(`Operation ${entry.op} is not supported for table ${entry.table}`);
    }

    if (uploadTable === 'projects') {
      if (entry.op === UpdateType.PUT) {
        const { error } = await supabase
          .from('projects')
          .upsert({ id: entry.id, ...payload }, { onConflict: 'id', ignoreDuplicates: true });
        if (error) {
          if (isDuplicateKeyError(error)) {
            return;
          }
          throw new Error(buildUploadFailureMessage('projects', entry.id, error));
        }
        return;
      }

      const { error } = await supabase.from('projects').update(payload).eq('id', entry.id);
      if (error) {
        throw new Error(buildUploadFailureMessage('projects', entry.id, error));
      }
      return;
    }

    if (uploadTable === 'users') {
      if (entry.op === UpdateType.PUT) {
        const { error } = await supabase
          .from('users')
          .upsert({ id: entry.id, ...payload }, { onConflict: 'id', ignoreDuplicates: true });
        if (error) {
          if (isDuplicateKeyError(error)) {
            return;
          }
          throw new Error(buildUploadFailureMessage('users', entry.id, error));
        }
        return;
      }

      if (entry.op === UpdateType.PATCH) {
        const { error } = await supabase.from('users').update(payload).eq('id', entry.id);
        if (error) {
          throw new Error(buildUploadFailureMessage('users', entry.id, error));
        }
        return;
      }

      throw new Error(`Operation ${entry.op} is not supported for table ${entry.table}`);
    }

    if (entry.op === UpdateType.PUT) {
      const { error } = await supabase
        .from('kit_details')
        .upsert({ id: entry.id, ...payload }, { onConflict: 'id', ignoreDuplicates: true });
      if (error) {
        if (isDuplicateKeyError(error)) {
          return;
        }
        throw new Error(buildUploadFailureMessage('kit_details', entry.id, error));
      }
      return;
    }

    if (entry.op !== UpdateType.DELETE) {
      throw new Error(`Operation ${entry.op} is not supported for table ${entry.table}`);
    }

    const { error } = await supabase.from('kit_details').delete().eq('id', entry.id);
    if (error) {
      throw new Error(buildUploadFailureMessage('kit_details', entry.id, error));
    }
  }
}
