'use client';

import { useQuery } from '@powersync/react';
import { useEffect, useRef } from 'react';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { type CountRow, DEBUG_COUNT_SQL, parseCount } from '@/lib/powersync/debug';
import { cn } from '@/lib/utils';

const LAST_COMPLETE_SYNC_KEY = 'ingexpert.lastCompleteSyncAt';

function getReadableStatus(
  state: ReturnType<typeof useSyncStatus>['state'],
  pendingQueueRows: number,
): string {
  if (state === 'offline') {
    return pendingQueueRows > 0
      ? `Offline (${pendingQueueRows} pendientes)`
      : 'Offline sin pendientes';
  }
  if (state === 'loading') {
    return 'Cargando datos iniciales';
  }
  if (state === 'syncing' || pendingQueueRows > 0) {
    return `Sincronizando (${pendingQueueRows} pendientes)`;
  }
  return 'Sincronizado';
}

export function SyncStatusIndicator() {
  const { state, lastUploadError } = useSyncStatus();
  const queueQuery = useQuery<CountRow>(DEBUG_COUNT_SQL.queue);
  const pendingQueueRows = parseCount(queueQuery.data);
  const wasFullySyncedRef = useRef(false);
  const isFullySynced = state === 'connected' && pendingQueueRows === 0 && !lastUploadError;

  useEffect(() => {
    if (!isFullySynced) {
      wasFullySyncedRef.current = false;
      return;
    }
    if (wasFullySyncedRef.current) {
      return;
    }
    wasFullySyncedRef.current = true;
    const now = new Date().toISOString();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_COMPLETE_SYNC_KEY, now);
    }
  }, [isFullySynced]);

  const persistedLastCompleteSyncAt =
    typeof window !== 'undefined' ? window.localStorage.getItem(LAST_COMPLETE_SYNC_KEY) : null;
  const lastCompleteSyncAt =
    isFullySynced && !persistedLastCompleteSyncAt
      ? new Date().toISOString()
      : persistedLastCompleteSyncAt;
  const lastCompleteSyncLabel = lastCompleteSyncAt
    ? new Date(lastCompleteSyncAt).toLocaleString('es-ES')
    : 'pendiente';

  const icon =
    state === 'offline' ? (
      <CloudOff className="h-3.5 w-3.5" />
    ) : state === 'connected' ? (
      <Wifi className="h-3.5 w-3.5" />
    ) : (
      <RefreshCw
        className={cn(
          'h-3.5 w-3.5',
          state === 'syncing' || state === 'loading' ? 'animate-spin' : '',
        )}
      />
    );

  const tone =
    state === 'connected'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
      : state === 'offline'
        ? 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
        : 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn('gap-1.5 px-3 py-1.5 text-[11px] md:text-xs', tone)}
          >
            {icon}
            {getReadableStatus(state, pendingQueueRows)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          hideArrow
          className="bg-popover text-popover-foreground border max-w-80 px-3 py-2 text-xs shadow-md"
        >
          <div className="space-y-1.5">
            <p>
              <span className="font-medium">Estado:</span>{' '}
              {getReadableStatus(state, pendingQueueRows)}
            </p>
            <p>
              <span className="font-medium">Última sincronización completa:</span>{' '}
              {lastCompleteSyncLabel}
            </p>
            <p>
              <span className="font-medium">Pendientes por subir:</span> {pendingQueueRows}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
