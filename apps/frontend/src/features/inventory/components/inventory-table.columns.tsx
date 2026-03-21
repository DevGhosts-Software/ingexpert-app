'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@powersync/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  ImageIcon,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  Warehouse,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { StorageImage } from '@/components/ui/storage-image';
import { ItemDeleteDialog } from './item-delete-dialog';
import { ItemDetailsSheet } from './item-details-sheet';
import { ItemFormSheet } from './item-form-sheet';
import {
  type InventoryItem,
  type ItemType,
  TYPE_COLORS,
  TYPE_CONFIG,
} from './inventory-table.types';

const EM_DASH = '—';

type MovementHistoryRow = {
  movement_id: string;
  movement_type: string;
  movement_destination: string | null;
  movement_observations: string | null;
  date: string;
  quantity: number | string | null;
};

function ItemTypeBadge({ type }: { type: ItemType }) {
  const { label, icon: Icon } = TYPE_CONFIG[type];
  const { badge } = TYPE_COLORS[type];
  return (
    <Badge className={`gap-1.5 font-normal ${badge}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function ColHeader({
  label,
  sorted,
  onClick,
}: {
  label: string;
  sorted?: 'asc' | 'desc' | false;
  onClick?: () => void;
}) {
  if (!onClick) {
    return <span className="font-medium">{label}</span>;
  }

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-1 hover:text-foreground font-medium"
    >
      {label}
      {sorted === 'asc' ? (
        <ArrowUp className="h-3 w-3" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
      )}
    </button>
  );
}

type ActionView = 'details' | 'edit' | 'delete' | null;

function formatMovementType(value: string, observations?: string | null): string {
  const normalizedObservations = observations?.toLowerCase().trim() ?? '';
  if (normalizedObservations.includes('importación de stock desde excel')) {
    return 'Importación desde Excel';
  }

  const normalized = value.toLowerCase().trim();
  if (normalized === 'stock_adjustment_in') return 'Ajuste de stock (entrada)';
  if (normalized === 'stock_adjustment_out') return 'Ajuste de stock (salida)';
  if (normalized === 'compra' || normalized === 'purchase') return 'Compra';
  if (normalized === 'salida' || normalized === 'exit') return 'Salida';
  if (normalized === 'devolucion' || normalized === 'return') return 'Devolución';
  if (normalized === 'baja' || normalized === 'writeoff') return 'Baja';
  if (normalized === 'ajuste_positivo') return 'Ajuste positivo';
  if (normalized === 'ajuste_negativo') return 'Ajuste negativo';
  return value;
}

function RowActions({ item, isAdmin }: { item: InventoryItem; isAdmin: boolean }) {
  const [open, setOpen] = useState<ActionView>(null);
  const historySql = useMemo(
    () => `
      SELECT
        m.id AS movement_id,
        LOWER(m.type) AS movement_type,
        m.destination AS movement_destination,
        m.observations AS movement_observations,
        m.date,
        md.quantity
      FROM movement_details md
      INNER JOIN movements m ON m.id = md.movement_id
      WHERE md.item_id = '${item.id.replaceAll("'", "''")}'
        AND LOWER(TRIM(m.type)) IN (
          'compra',
          'salida',
          'devolucion',
          'baja',
          'purchase',
          'exit',
          'return',
          'writeoff',
          'ajuste_positivo',
          'ajuste_negativo',
          'stock_adjustment_in',
          'stock_adjustment_out'
        )
      ORDER BY m.date DESC
      LIMIT 12
    `,
    [item.id],
  );
  const historyQuery = useQuery<MovementHistoryRow>(historySql);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-96">
          <DropdownMenuItem onClick={() => setOpen('details')}>
            <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
            Ver detalles
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={() => setOpen('edit')}>
                <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                Editar ítem
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpen('delete')}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar ítem
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
            Historial de movimientos
          </DropdownMenuLabel>
          <div className="px-2 pb-1">
            {historyQuery.isFetching && (historyQuery.data?.length ?? 0) === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">Cargando historial...</p>
            ) : (historyQuery.data?.length ?? 0) === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">
                Sin movimientos visibles para este ítem.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-sm border">
                {(historyQuery.data ?? []).map((movement) => (
                  <div
                    key={`${movement.movement_id}-${movement.date}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b px-2 py-1.5 text-xs last:border-b-0"
                  >
                    <span className="font-medium text-foreground">
                      {formatMovementType(
                        movement.movement_type,
                        movement.movement_observations,
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(movement.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                    <span className="font-mono tabular-nums">{Number(movement.quantity ?? 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ItemDetailsSheet item={item} open={open === 'details'} onClose={() => setOpen(null)} />
      {isAdmin && (
        <>
          <ItemFormSheet
            mode="edit"
            item={item}
            open={open === 'edit'}
            onClose={() => setOpen(null)}
          />
          <ItemDeleteDialog item={item} open={open === 'delete'} onClose={() => setOpen(null)} />
        </>
      )}
    </div>
  );
}

type SelectionScopeState = {
  checked: boolean;
  indeterminate: boolean;
};

export type InventoryTableMeta = {
  selectionState: SelectionScopeState;
  onToggleScope: () => void;
  isRowSelected: (id: string) => boolean;
  onToggleRow: (id: string) => void;
};

export function getColumns(isAdmin: boolean): ColumnDef<InventoryItem>[] {
  const selectionColumn: ColumnDef<InventoryItem> | null = isAdmin
    ? {
        id: 'select',
        header: ({ table }) => {
          const meta = table.options.meta as InventoryTableMeta | undefined;
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
                aria-label="Seleccionar elementos filtrados"
                className="size-5"
              />
            </div>
          );
        },
        cell: ({ row, table }) => {
          const meta = table.options.meta as InventoryTableMeta | undefined;
          if (!meta) {
            return null;
          }
          return (
            <div className="flex justify-center" onClick={(event) => event.stopPropagation()}>
              <Checkbox
                checked={meta.isRowSelected(row.original.id)}
                onCheckedChange={() => meta.onToggleRow(row.original.id)}
                aria-label={`Seleccionar ${row.original.name}`}
                className="size-5"
              />
            </div>
          );
        },
        enableSorting: false,
        size: 44,
      }
    : null;

  return [
    ...(selectionColumn ? [selectionColumn] : []),
    {
      id: 'image',
      header: () => <span className="sr-only">Imagen</span>,
      cell: ({ row }) => {
        const isKit = row.original.type === 'KIT';
        const url = row.original.imageUrl;
        if (isKit) {
          return (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-md border bg-muted/50 flex items-center justify-center shrink-0 text-muted-foreground/50 text-xs">
                {EM_DASH}
              </div>
            </div>
          );
        }
        if (!url) {
          return (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-md border bg-muted/50 flex items-center justify-center shrink-0">
                <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
              </div>
            </div>
          );
        }
        return (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-md border overflow-hidden bg-muted/50 shrink-0">
              <StorageImage src={url} alt={row.original.name} className="w-10 h-10 object-cover" />
            </div>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <ColHeader
          label="Nombre"
          sorted={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium block max-w-[300px] truncate" title={row.getValue('name')}>
          {row.getValue('name')}
        </span>
      ),
    },
    {
      accessorKey: 'code',
      header: ({ column }) => (
        <div className="flex justify-center">
          <ColHeader
            label="Código"
            sorted={column.getIsSorted()}
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          />
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-medium font-mono block text-center">{row.getValue('code')}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: () => (
        <div className="flex justify-center">
          <span className="font-medium">Tipo</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ItemTypeBadge type={row.getValue('type')} />
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <ColHeader
          label="Ubicacion"
          sorted={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        />
      ),
      cell: ({ row }) => {
        if (row.original.type === 'KIT') {
          return <span className="font-mono text-sm text-muted-foreground/50">{EM_DASH}</span>;
        }
        return (
          <span
            className="flex items-center gap-1 text-sm text-muted-foreground max-w-[160px]"
            title={row.getValue('location')}
          >
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{row.getValue('location')}</span>
          </span>
        );
      },
    },
    {
      accessorKey: 'warehouseInventory',
      header: ({ column }) => (
        <div className="flex justify-center">
          <ColHeader
            label="Almacén"
            sorted={column.getIsSorted()}
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          />
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm block text-center">
          {row.getValue('warehouseInventory')}
        </span>
      ),
    },
    {
      accessorKey: 'onsiteInventory',
      header: ({ column }) => (
        <div className="flex justify-center">
          <ColHeader
            label="En obra"
            sorted={column.getIsSorted()}
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          />
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm block text-center">
          {row.getValue('onsiteInventory')}
        </span>
      ),
    },
    {
      accessorKey: 'totalInventory',
      header: ({ column }) => (
        <div className="flex justify-center">
          <ColHeader
            label="Total"
            sorted={column.getIsSorted()}
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1.5">
          <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-sm">{row.getValue('totalInventory')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'unit',
      header: ({ column }) => (
        <div className="flex justify-center">
          <ColHeader
            label="Unidad"
            sorted={column.getIsSorted()}
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          />
        </div>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm block text-center">
          {row.original.type === 'KIT' ? (
            <span className="text-muted-foreground/50">{EM_DASH}</span>
          ) : (
            row.getValue('unit')
          )}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <RowActions item={row.original} isAdmin={isAdmin} />
        </div>
      ),
      enableSorting: false,
    },
  ];
}
