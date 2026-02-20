'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MapPin, MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { type InventoryItem, type ItemType, LOW_STOCK_THRESHOLD, TYPE_CONFIG } from './inventory-table.types';

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="destructive">Sin stock</Badge>;
  if (stock < LOW_STOCK_THRESHOLD)
    return (
      <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">
        Stock bajo
      </Badge>
    );
  return <Badge variant="outline">En stock</Badge>;
}

function ItemTypeBadge({ type }: { type: ItemType }) {
  const { label, variant, icon: Icon } = TYPE_CONFIG[type];
  return (
    <Badge variant={variant} className="gap-1 font-normal">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function ColHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 hover:text-foreground font-medium">
      {label}
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
      </svg>
    </button>
  );
}

export const COLUMNS: ColumnDef<InventoryItem>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        data-state={
          table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
            ? 'indeterminate'
            : undefined
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Seleccionar todo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label={`Seleccionar ${row.original.name}`}
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <ColHeader label="Nombre" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} />
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
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
      <ColHeader label="Ubicacion" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} />
    ),
    cell: ({ row }) => (
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {row.getValue('location')}
      </span>
    ),
  },
  {
    accessorKey: 'stock',
    header: ({ column }) => (
      <ColHeader label="Stock" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.getValue('stock')} {row.original.unit}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Estado',
    cell: ({ row }) => <StockBadge stock={row.original.stock} />,
    enableSorting: false,
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Acciones</span>,
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Ver detalles</DropdownMenuItem>
          <DropdownMenuItem>Editar item</DropdownMenuItem>
          <DropdownMenuItem>Ajustar stock</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">Marcar para baja</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
];
