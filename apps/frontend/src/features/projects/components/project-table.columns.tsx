'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ProjectFormSheet } from './project-form-sheet';
import { ProjectDeleteSheet } from './project-delete-sheet';
import type { ProjectRow } from './project-table.types';

function ColHeader({
  label,
  sorted,
  onClick,
}: {
  label: string;
  sorted?: 'asc' | 'desc' | false;
  onClick?: () => void;
}) {
  if (!onClick) return <span className="font-medium">{label}</span>;
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

type ActionView = 'edit' | 'delete' | null;

function RowActions({ project }: { project: ProjectRow }) {
  const [view, setView] = useState<ActionView>(null);

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
          <DropdownMenuItem onClick={() => setView('edit')}>
            <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
            Editar proyecto
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setView('delete')}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar proyecto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectFormSheet
        mode="edit"
        project={project}
        open={view === 'edit'}
        onClose={() => setView(null)}
      />
      <ProjectDeleteSheet
        project={project}
        open={view === 'delete'}
        onClose={() => setView(null)}
      />
    </div>
  );
}

export function getColumns(): ColumnDef<ProjectRow>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <ColHeader
          label="Proyecto"
          sorted={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium block max-w-[240px] truncate" title={row.getValue('name')}>
          {row.getValue('name')}
        </span>
      ),
    },
    {
      accessorKey: 'manager',
      header: ({ column }) => (
        <ColHeader
          label="Responsable"
          sorted={column.getIsSorted()}
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        />
      ),
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-sm">
          <User className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[160px]" title={row.getValue('manager')}>
            {row.getValue('manager')}
          </span>
        </span>
      ),
    },
    {
      accessorKey: 'contact',
      header: 'Contacto',
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Phone className="h-3 w-3 shrink-0" />
          {row.getValue('contact')}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'address',
      header: 'Dirección',
      cell: ({ row }) => (
        <span
          className="flex items-center gap-1 text-sm text-muted-foreground max-w-[200px]"
          title={row.getValue('address')}
        >
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{row.getValue('address')}</span>
        </span>
      ),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => <RowActions project={row.original} />,
      enableSorting: false,
    },
  ];
}
