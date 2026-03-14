'use client';

import { useStatus } from '@powersync/react';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  getPowerSyncConnectorDebugSnapshot,
  subscribePowerSyncConnectorDebug,
} from '@/lib/powersync/connector';

export type SyncUiState = 'loading' | 'syncing' | 'connected' | 'offline';

function toTimestamp(value: string | null): number {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function useSyncStatus() {
  const status = useStatus();
  const connectorState = useSyncExternalStore(
    subscribePowerSyncConnectorDebug,
    getPowerSyncConnectorDebugSnapshot,
    getPowerSyncConnectorDebugSnapshot,
  );
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const lastUploadAt = connectorState.lastUploadAt;
  const hasRecentUploadAttempt =
    toTimestamp(connectorState.lastUploadAttemptAt) > toTimestamp(connectorState.lastUploadAt);
  const isSyncing = !status.hasSynced || hasRecentUploadAttempt;

  const state: SyncUiState = useMemo(() => {
    if (!isOnline || !status.connected) {
      return 'offline';
    }
    if (!status.hasSynced) {
      return 'loading';
    }
    if (isSyncing) {
      return 'syncing';
    }
    return 'connected';
  }, [isOnline, isSyncing, status.connected, status.hasSynced]);

  return {
    state,
    lastUploadAt,
    lastUploadError: connectorState.lastUploadError,
  };
}
