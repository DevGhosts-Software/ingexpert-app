import type { AbstractPowerSyncDatabase, CrudEntry, PowerSyncCredentials } from '@powersync/web';
import { UpdateType, type PowerSyncBackendConnector } from '@powersync/web';
import { supabase } from '@/lib/supabase';

const MISSING_SESSION_ERROR = 'Cannot upload PowerSync CRUD without an active Supabase session';
const POWERSYNC_PERMISSION_REMEDIATION =
  'Permiso denegado: verifica tus permisos o contacta al administrador.';

type CrudPayload = Record<string, unknown>;
type ConnectorDebugListener = () => void;
export type PermissionErrorEvent = {
  table: string;
  recordId: string;
  errorMessage: string;
};
type PermissionErrorListener = (event: PermissionErrorEvent) => void;

const permissionErrorListeners = new Set<PermissionErrorListener>();

export function subscribePermissionError(listener: PermissionErrorListener): () => void {
  permissionErrorListeners.add(listener);
  return () => permissionErrorListeners.delete(listener);
}

function emitPermissionError(table: string, recordId: string, errorMessage: string): void {
  const event: PermissionErrorEvent = { table, recordId, errorMessage };
  for (const listener of permissionErrorListeners) {
    listener(event);
  }
}

type SessionRevalidationListener = () => void;
const sessionRevalidationListeners = new Set<SessionRevalidationListener>();

export function subscribeSessionRevalidation(listener: SessionRevalidationListener): () => void {
  sessionRevalidationListeners.add(listener);
  return () => sessionRevalidationListeners.delete(listener);
}

async function revalidateSession(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return true;
    }

    const { error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      const isSessionNotFound =
        refreshError.message?.includes('session') ||
        refreshError.message?.includes('not found') ||
        refreshError.message?.includes('invalid') ||
        refreshError.code === 'invalid_grant';

      if (!isSessionNotFound) {
        await supabase.auth.signOut();
        for (const listener of sessionRevalidationListeners) {
          listener();
        }
        return false;
      }
      return true;
    }

    return true;
  } catch {
    return true;
  }
}

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

export function shouldSkipCrudUpload(_entry: CrudEntry): boolean {
  return false;
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
    normalizedMessage.includes('new row violates row-level security policy') ||
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

function extractSupabaseError(error: unknown): SupabaseUploadError | null {
  if (error && typeof error === 'object' && 'message' in error) {
    const e = error as Record<string, unknown>;
    return {
      message: String(e.message),
      code: (e.code as string | null) ?? null,
      details: (e.details as string | null) ?? null,
      hint: (e.hint as string | null) ?? null,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message,
      code: null,
      details: null,
      hint: null,
    };
  }
  return null;
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

function omitLocalMetadata(payload: CrudPayload): CrudPayload {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    const isSessionValid = await revalidateSession();
    if (!isSessionValid) {
      return;
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
          try {
            await this.uploadCrudEntry(entry);
            uploadedCount += 1;
          } catch (error) {
            const supabaseError = extractSupabaseError(error);
            if (supabaseError && isPowerSyncPermissionDeniedError(supabaseError)) {
              const errorMessage = error instanceof Error ? error.message : 'Permission denied';
              try {
                await database.execute('DELETE FROM ps_crud WHERE id = ?', [entry.id]);
              } catch (deleteError) {
                console.error('Failed to delete permission-denied record from queue:', deleteError);
              }
              await revalidateSession();
              emitPermissionError(entry.table, entry.id, errorMessage);
              skippedCount += 1;
              continue;
            }
            throw error;
          }
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
          movementPayload.type = 'STOCK_ADJUSTMENT_IN';
          movementPayload.destination = null;
        } else if (normalizedType === 'ajuste_negativo') {
          movementPayload.type = 'STOCK_ADJUSTMENT_OUT';
          movementPayload.destination = null;
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
