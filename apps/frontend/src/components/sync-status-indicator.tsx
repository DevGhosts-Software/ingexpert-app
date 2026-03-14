'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { cn } from '@/lib/utils';

function getStateLabel(state: ReturnType<typeof useSyncStatus>['state']): string {
  if (state === 'offline') {
    return 'Modo offline';
  }
  if (state === 'loading') {
    return 'Cargando sincronización';
  }
  if (state === 'syncing') {
    return 'Sincronizando';
  }
  return 'Conectado';
}

function getLastSyncLabel(lastUploadAt: string | null): string {
  if (!lastUploadAt) {
    return 'Última sync: pendiente';
  }

  return `Última sync: ${formatDistanceToNow(new Date(lastUploadAt), {
    addSuffix: true,
    locale: es,
  })}`;
}

export function SyncStatusIndicator() {
  const { state, lastUploadAt, lastUploadError } = useSyncStatus();

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
      <Badge variant="outline" className={cn('gap-1.5', tone)}>
        {icon}
        {getStateLabel(state)}
      </Badge>
      <span className="hidden lg:inline text-xs text-muted-foreground">
        {getLastSyncLabel(lastUploadAt)}
      </span>
      {lastUploadError ? (
        <span
          className="hidden xl:inline text-xs text-rose-600 max-w-52 truncate"
          title={lastUploadError}
        >
          Error en sincronización
        </span>
      ) : null}
    </div>
  );
}
