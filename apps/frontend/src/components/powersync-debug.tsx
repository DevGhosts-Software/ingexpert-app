'use client';

import { useQuery, useStatus } from '@powersync/react';
import { useMemo, useState, useSyncExternalStore } from 'react';
import {
  getPowerSyncConnectorDebugSnapshot,
  subscribePowerSyncConnectorDebug,
} from '@/lib/powersync/connector';
import { cn } from '@/lib/utils';
import { DEBUG_COUNT_SQL, parseCount, type CountRow } from '@/lib/powersync/debug';

export function PowerSyncDebug({ className }: { className?: string }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const status = useStatus();
  const connectorState = useSyncExternalStore(
    subscribePowerSyncConnectorDebug,
    getPowerSyncConnectorDebugSnapshot,
    getPowerSyncConnectorDebugSnapshot,
  );
  const itemsQuery = useQuery<CountRow>(DEBUG_COUNT_SQL.items);
  const projectsQuery = useQuery<CountRow>(DEBUG_COUNT_SQL.projects);
  const movementsQuery = useQuery<CountRow>(DEBUG_COUNT_SQL.movements);
  const movementDetailsQuery = useQuery<CountRow>(DEBUG_COUNT_SQL.movementDetails);
  const usersQuery = useQuery<CountRow>(DEBUG_COUNT_SQL.users);
  const bucketsQuery = useQuery<CountRow>(DEBUG_COUNT_SQL.buckets);
  const queueQuery = useQuery<CountRow>(DEBUG_COUNT_SQL.queue);

  const tableCounts = useMemo(
    () => ({
      items: parseCount(itemsQuery.data),
      projects: parseCount(projectsQuery.data),
      movements: parseCount(movementsQuery.data),
      movementDetails: parseCount(movementDetailsQuery.data),
      users: parseCount(usersQuery.data),
      buckets: parseCount(bucketsQuery.data),
      pendingQueueRows: parseCount(queueQuery.data),
    }),
    [
      bucketsQuery.data,
      itemsQuery.data,
      movementDetailsQuery.data,
      movementsQuery.data,
      projectsQuery.data,
      queueQuery.data,
      usersQuery.data,
    ],
  );

  const queryErrors = [
    itemsQuery.error,
    projectsQuery.error,
    movementsQuery.error,
    movementDetailsQuery.error,
    usersQuery.error,
    bucketsQuery.error,
    queueQuery.error,
  ]
    .filter((value): value is Error => value instanceof Error)
    .map((error) => error.message);

  const isBusySyncing =
    !status.hasSynced ||
    itemsQuery.isFetching ||
    projectsQuery.isFetching ||
    movementsQuery.isFetching ||
    movementDetailsQuery.isFetching ||
    usersQuery.isFetching ||
    bucketsQuery.isFetching ||
    queueQuery.isFetching;
  const isOfflineBrowser = typeof navigator !== 'undefined' ? !navigator.onLine : false;
  const connectionLabel = status.connected
    ? '🟢 Conectado'
    : isOfflineBrowser
      ? '🔴 Sin internet'
      : '🟠 Endpoint desconectado';

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 rounded-lg border border-green-500/30 bg-black/90 p-4 font-mono text-xs text-green-400 shadow-xl backdrop-blur-sm',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between border-b border-gray-700 pb-1">
        <h3 className="font-bold text-white">⚙️ PowerSync Debug</h3>
        <button
          type="button"
          onClick={() => setIsMinimized((value) => !value)}
          className="rounded border border-gray-600 px-1.5 py-0.5 text-[10px] text-gray-200 hover:bg-gray-800"
          aria-label={isMinimized ? 'Expandir debug' : 'Minimizar debug'}
        >
          {isMinimized ? 'Expandir' : 'Minimizar'}
        </button>
      </div>
      {isMinimized ? (
        <div className="space-y-1">
          <p>🔌 {connectionLabel}</p>
          <p>📬 Cola: {tableCounts.pendingQueueRows}</p>
        </div>
      ) : (
        <div className="space-y-1">
          <p>🔌 Conexión: {connectionLabel}</p>
          <p>🔄 Estado Sync: {status.hasSynced ? '✅ Sincronizado' : '🟡 Sincronizando...'}</p>
          <p>⬇️ Actividad: {isBusySyncing ? '🟡 Sí...' : '⏸️ No'}</p>
          <p>
            🔑 Sesión:{' '}
            {connectorState.sessionUserId ? `✅ ${connectorState.sessionUserId}` : '⚠️ Sin sesión'}
          </p>
          <p>🕒 Expira token: {connectorState.sessionExpiresAt ?? '—'}</p>
          <div className="mt-2 border-t border-gray-700 pt-2">
            <p>📦 items: {tableCounts.items}</p>
            <p>🗂️ projects: {tableCounts.projects}</p>
            <p>🧾 movements: {tableCounts.movements}</p>
            <p>🧩 movement_details: {tableCounts.movementDetails}</p>
            <p>👥 users: {tableCounts.users}</p>
            <p>🪣 buckets: {tableCounts.buckets}</p>
            <p>📬 Cola (ps_crud): {tableCounts.pendingQueueRows}</p>
            <p>
              ☁️ Último upload: {connectorState.lastUploadAt ?? '—'} (ok:{' '}
              {connectorState.lastBatchUploaded}, skip: {connectorState.lastBatchSkipped}, more:{' '}
              {connectorState.lastBatchHadMore ? 'sí' : 'no'})
            </p>
            <p>🔐 Última credencial: {connectorState.lastCredentialAt ?? '—'}</p>
            {connectorState.lastCredentialError ? (
              <p className="text-red-400">Credential error: {connectorState.lastCredentialError}</p>
            ) : null}
            {connectorState.lastUploadError ? (
              <p className="text-red-400">Upload error: {connectorState.lastUploadError}</p>
            ) : null}
            {queryErrors.map((errorMessage) => (
              <p key={errorMessage} className="text-red-400">
                Query error: {errorMessage}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
