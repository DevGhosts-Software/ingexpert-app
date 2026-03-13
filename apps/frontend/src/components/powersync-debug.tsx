'use client';

import { useQuery, useStatus } from '@powersync/react';

type CountRow = {
  total: number | string | null;
};

function getCount(data: CountRow[]): number {
  const rawValue = data[0]?.total ?? 0;
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function PowerSyncDebug() {
  const status = useStatus();
  const itemsQuery = useQuery<CountRow>('SELECT COUNT(*) as total FROM items');
  const bucketsQuery = useQuery<CountRow>('SELECT COUNT(*) as total FROM ps_buckets');

  const itemCount = getCount(itemsQuery.data);
  const bucketCount = getCount(bucketsQuery.data);
  const isBusySyncing = !status.hasSynced || itemsQuery.isFetching || bucketsQuery.isFetching;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-green-500/30 bg-black/90 p-4 font-mono text-xs text-green-400 shadow-xl backdrop-blur-sm">
      <h3 className="mb-2 border-b border-gray-700 pb-1 font-bold text-white">
        ⚙️ PowerSync Debug
      </h3>
      <div className="space-y-1">
        <p>🔌 WebSocket: {status.connected ? '🟢 Conectado' : '🔴 Desconectado'}</p>
        <p>🔄 Estado Sync: {status.hasSynced ? '✅ Sincronizado' : '🟡 Sincronizando...'}</p>
        <p>⬇️ Actividad: {isBusySyncing ? '🟡 Sí...' : '⏸️ No'}</p>
        <div className="mt-2 border-t border-gray-700 pt-2">
          <p>🪣 Buckets recibidos: {bucketCount}</p>
          <p>📦 Items en SQLite: {itemCount}</p>
          {bucketsQuery.error ? (
            <p className="text-red-400">Buckets query error: {bucketsQuery.error.message}</p>
          ) : null}
          {itemsQuery.error ? (
            <p className="text-red-400">Items query error: {itemsQuery.error.message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
