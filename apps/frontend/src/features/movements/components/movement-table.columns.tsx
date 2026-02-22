'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowDownCircle, ArrowUpCircle, CalendarIcon, Eye, MapPin, MoreHorizontal, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { MovementDetailSheet } from './movement-detail-sheet';
import type { MovementRow } from './movement-table.types';

export function TypeBadge({ type }: { type: 'ENTRY' | 'EXIT' }) {
  if (type === 'ENTRY') {
    return (
      <Badge className="gap-1.5 bg-green-100 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
        <ArrowDownCircle className="h-3 w-3" />
        Entrada
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

function RowActions({ row }: { row: MovementRow }) {
  const [open, setOpen] = useState(false);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
            Ver detalle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MovementDetailSheet movementId={row.id} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export function getColumns(): ColumnDef<MovementRow>[] {
  return [
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => <TypeBadge type={row.original.type} />,
      enableSorting: false,
    },
    {
      accessorKey: 'date',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {format(new Date(row.original.date), 'dd/MM/yyyy', { locale: es })}
        </div>
      ),
    },
    {
      accessorKey: 'creatorName',
      header: 'Creado por',
      cell: ({ row }) => (
        <span className="font-medium block max-w-[160px] truncate" title={row.original.creatorName ?? ''}>
          {row.original.creatorName ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'projectName',
      header: 'Proyecto',
      cell: ({ row }) =>
        row.original.projectName ? (
          <span className="text-sm block max-w-[160px] truncate" title={row.original.projectName}>
            {row.original.projectName}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
      enableSorting: false,
    },
    {
      accessorKey: 'destination',
      header: 'Destino',
      cell: ({ row }) =>
        row.original.destination ? (
          <span className="flex items-center gap-1 text-sm text-muted-foreground max-w-[160px]" title={row.original.destination}>
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{row.original.destination}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
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
    {
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => <RowActions row={row.original} />,
      enableSorting: false,
    },
  ];
}
