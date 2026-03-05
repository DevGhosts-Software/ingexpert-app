'use client';

import { useState } from 'react';
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
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

function RowActions({ item, isAdmin }: { item: InventoryItem; isAdmin: boolean }) {
  const [open, setOpen] = useState<ActionView>(null);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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

export function getColumns(isAdmin: boolean): ColumnDef<InventoryItem>[] {
  return [
    {
      id: 'image',
      header: () => <span className="sr-only">Imagen</span>,
      cell: ({ row }) => {
        const isKit = row.original.type === 'KIT';
        const url = row.original.imageUrl;
        if (isKit) {
          return (
            <div className="w-10 h-10 rounded-md border bg-muted/50 flex items-center justify-center shrink-0 text-muted-foreground text-xs">
              {EM_DASH}
            </div>
          );
        }
        if (!url) {
          return (
            <div className="w-10 h-10 rounded-md border bg-muted/50 flex items-center justify-center shrink-0">
              <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
            </div>
          );
        }
        return (
          <div className="w-10 h-10 rounded-md border overflow-hidden bg-muted/50 shrink-0">
            <StorageImage src={url} alt={row.original.name} className="w-10 h-10 object-cover" />
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
        <ColHeader
          label="Código"
          sorted={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        />
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue('code')}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => <ItemTypeBadge type={row.getValue('type')} />,
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
      cell: ({ row }) => (
        <span
          className="flex items-center gap-1 text-sm text-muted-foreground max-w-[160px]"
          title={row.getValue('location')}
        >
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{row.getValue('location')}</span>
        </span>
      ),
    },
    {
      accessorKey: 'stock',
      header: ({ column }) => (
        <ColHeader
          label="Stock"
          sorted={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.type === 'KIT' ? EM_DASH : row.getValue('stock')}
        </span>
      ),
    },
    {
      accessorKey: 'unit',
      header: ({ column }) => (
        <ColHeader
          label="Unidad"
          sorted={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.type === 'KIT' ? EM_DASH : row.getValue('unit')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => <RowActions item={row.original} isAdmin={isAdmin} />,
      enableSorting: false,
    },
  ];
}
