'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  Briefcase,
  KeyRound,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
  User,
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

import type { UserEntity, UserRole } from './user-table.types';

export function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'ADMIN') {
    return (
      <Badge className="gap-1.5 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
        <ShieldCheck className="h-3 w-3" />
        Administrador
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1.5">
      <User className="h-3 w-3" />
      Usuario
    </Badge>
  );
}

export function UserAvatar({ name, email }: { name: string | null; email: string }) {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : email[0].toUpperCase();

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
      {initials}
    </div>
  );
}

function RowActions({ user }: { user: UserEntity }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
          Editar usuario
        </DropdownMenuItem>
        <DropdownMenuItem>
          <KeyRound className="h-4 w-4 mr-2 text-muted-foreground" />
          Restablecer contraseña
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          {user.role === 'ADMIN' ? (
            <>
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              Cambiar a Usuario
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" />
              Promover a Admin
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar usuario
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getColumns(): ColumnDef<UserEntity>[] {
  return [
    {
      id: 'name',
      accessorFn: (row) => row.name ?? '',
      header: 'Usuario',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={row.original.name} email={row.original.email} />
          <span className="font-medium">{row.original.name ?? '—'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Correo',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.email}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
      enableSorting: false,
    },
    {
      accessorKey: 'workArea',
      header: 'Área',
      cell: ({ row }) =>
        row.original.workArea ? (
          <Badge variant="secondary" className="gap-1 font-normal">
            <Briefcase className="h-3 w-3" />
            {row.original.workArea}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
            Sin asignar
          </Badge>
        ),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => <RowActions user={row.original} />,
      enableSorting: false,
    },
  ];
}
