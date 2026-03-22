'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
  FileText,
  MapPin,
  Package,
  RotateCcw,
  Trash2,
  User,
} from 'lucide-react';
import { formatLocalDate } from '@/lib/dates';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { MovementRow, MovementTableMeta } from './movement-table.types';

// ─── Row accent colors by movement type ──────────────────────────────────────

export const MOVEMENT_ROW_ACCENT: Record<
  'PURCHASE' | 'RETURN' | 'EXIT' | 'WRITEOFF' | 'STOCK_ADJUSTMENT_IN' | 'STOCK_ADJUSTMENT_OUT',
  string
> = {
  PURCHASE: 'inset 2px 0 0 #2563eb',
  RETURN: 'inset 2px 0 0 #16a34a',
  EXIT: 'inset 2px 0 0 #ea580c',
  WRITEOFF: 'inset 2px 0 0 #dc2626',
  STOCK_ADJUSTMENT_IN: 'inset 2px 0 0 #9333ea',
  STOCK_ADJUSTMENT_OUT: 'inset 2px 0 0 #9333ea',
};

// ─── TypeBadge ────────────────────────────────────────────────────────────────

export function TypeBadge({
  type,
  observations,
}: {
  type:
    | 'PURCHASE'
    | 'RETURN'
    | 'EXIT'
    | 'WRITEOFF'
    | 'STOCK_ADJUSTMENT_IN'
    | 'STOCK_ADJUSTMENT_OUT';
  observations?: string | null;
}) {
  const normalizedType = typeof type === 'string' ? type.toUpperCase().trim() : '';
  const normalizedObservations = observations?.toLowerCase().trim() ?? '';

  if (normalizedObservations.includes('importación de stock desde excel')) {
    return (
      <Badge className="gap-1.5 bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
        <ArrowDownCircle className="h-3 w-3" />
        Importación desde Excel
      </Badge>
    );
  }

  if (normalizedType === 'PURCHASE') {
    return (
      <Badge className="gap-1.5 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
        <ArrowDownCircle className="h-3 w-3" />
        Compra
      </Badge>
    );
  }
  if (normalizedType === 'RETURN') {
    return (
      <Badge className="gap-1.5 bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
        <RotateCcw className="h-3 w-3" />
        Devolución
      </Badge>
    );
  }
  if (normalizedType === 'WRITEOFF') {
    return (
      <Badge className="gap-1.5 bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
        <Trash2 className="h-3 w-3" />
        Baja
      </Badge>
    );
  }
  if (normalizedType === 'STOCK_ADJUSTMENT_IN') {
    return (
      <Badge className="gap-1.5 bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
        <ArrowDownCircle className="h-3 w-3" />
        Ajuste
      </Badge>
    );
  }
  if (normalizedType === 'STOCK_ADJUSTMENT_OUT') {
    return (
      <Badge className="gap-1.5 bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
        <ArrowUpCircle className="h-3 w-3" />
        Ajuste
      </Badge>
    );
  }
  return (
    <Badge className="gap-1.5 bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
      <ArrowUpCircle className="h-3 w-3" />
      Salida
    </Badge>
  );
}

// ─── ContextCell ──────────────────────────────────────────────────────────────
// 2-line smart cell: primary context (project/destination) + secondary (responsible)

function ContextCell({ row }: { row: MovementRow }) {
  const { type, projectName, destination, responsibleDeliveryName, responsibleReceiptName } = row;
  const normalizedType = typeof type === 'string' ? type.toUpperCase().trim() : '';

  switch (normalizedType) {
    case 'PURCHASE':
    case 'STOCK_ADJUSTMENT_IN':
      return responsibleReceiptName ? (
        <div className="flex items-center gap-1.5 text-sm">
          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[180px]" title={responsibleReceiptName}>
            {responsibleReceiptName}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );

    case 'RETURN':
      return (
        <div className="space-y-0.5">
          {projectName ? (
            <div className="flex items-center gap-1.5 text-sm">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[180px] font-medium" title={projectName}>
                {projectName}
              </span>
            </div>
          ) : null}
          {responsibleReceiptName ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[180px]" title={responsibleReceiptName}>
                Devuelve: {responsibleReceiptName}
              </span>
            </div>
          ) : null}
          {!projectName && !responsibleReceiptName && (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>
      );

    case 'EXIT': {
      const primary = projectName ?? destination;
      const isPrimProject = !!projectName;
      return (
        <div className="space-y-0.5">
          {primary ? (
            <div className="flex items-center gap-1.5 text-sm">
              {isPrimProject ? (
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="truncate max-w-[180px] font-medium" title={primary}>
                {primary}
              </span>
            </div>
          ) : null}
          {projectName && destination ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[180px]" title={destination}>
                {destination}
              </span>
            </div>
          ) : null}
          {responsibleDeliveryName ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[180px]" title={responsibleDeliveryName}>
                Entrega: {responsibleDeliveryName}
              </span>
            </div>
          ) : null}
          {!primary && !responsibleDeliveryName && (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>
      );
    }

    case 'WRITEOFF':
    case 'STOCK_ADJUSTMENT_OUT':
    default:
      return <span className="text-muted-foreground text-sm">—</span>;
  }
}

// ─── NotesCell ────────────────────────────────────────────────────────────────

function NotesCell({ observations }: { observations: string | null }) {
  if (!observations) return <span className="text-muted-foreground text-sm">—</span>;

  const preview = observations.length > 50 ? observations.slice(0, 50) + '…' : observations;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-start gap-1.5 text-sm cursor-default max-w-[200px]">
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="truncate text-muted-foreground">{preview}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs whitespace-pre-wrap">
          {observations}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

export function getColumns(): ColumnDef<MovementRow>[] {
  return [
    {
      id: 'select',
      meta: { center: true, width: 'w-[44px]' },
      header: ({ table }) => {
        const meta = table.options.meta as MovementTableMeta | undefined;
        if (!meta) {
          return null;
        }

        return (
          <div className="flex justify-center">
            <Checkbox
              checked={
                meta.selectionState.checked
                  ? true
                  : meta.selectionState.indeterminate
                    ? 'indeterminate'
                    : false
              }
              onCheckedChange={() => meta.onToggleScope()}
              onClick={(event) => event.stopPropagation()}
              aria-label="Seleccionar movimientos filtrados"
              className="size-5"
            />
          </div>
        );
      },
      cell: ({ row, table }) => {
        const meta = table.options.meta as MovementTableMeta | undefined;
        if (!meta) {
          return null;
        }

        return (
          <div className="flex justify-center" onClick={(event) => event.stopPropagation()}>
            <Checkbox
              checked={meta.isRowSelected(row.original.id)}
              onCheckedChange={() => meta.onToggleRow(row.original.id)}
              aria-label={`Seleccionar movimiento ${row.original.id}`}
              className="size-5"
            />
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'type',
      meta: { center: true, width: 'w-[130px]' },
      header: () => <span className="font-medium">Tipo</span>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <TypeBadge type={row.original.type} observations={row.original.observations} />
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'date',
      meta: { center: true },
      header: () => <span className="font-medium">Fecha</span>,
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap tabular-nums block text-center">
          {formatLocalDate(row.original.date, 'dd/MM/yyyy')}
        </span>
      ),
    },
    {
      accessorKey: 'creatorName',
      header: 'Registrado por',
      cell: ({ row }) => (
        <span
          className="text-sm font-medium block max-w-[150px] truncate"
          title={row.original.creatorName ?? ''}
        >
          {row.original.creatorName ?? '—'}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: 'context',
      header: 'Contexto',
      cell: ({ row }) => <ContextCell row={row.original} />,
      enableSorting: false,
    },
    {
      id: 'notes',
      header: 'Notas',
      cell: ({ row }) => <NotesCell observations={row.original.observations ?? null} />,
      enableSorting: false,
    },
    {
      id: 'itemsCount',
      header: () => <span className="block text-center">Ítems</span>,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="secondary" className="font-mono text-xs">
            <Package className="h-3 w-3 mr-1" />
            {row.original.itemsCount}
          </Badge>
        </div>
      ),
      enableSorting: false,
    },
  ];
}
