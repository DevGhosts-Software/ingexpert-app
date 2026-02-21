'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ChevronDown,
  Filter,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react';

import { type UserRole } from '@ingexpert/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type { UserRole } from '@ingexpert/schema';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  workArea?: string;
  avatar?: string;
}

interface UserTableProps {
  users: AppUser[];
  isLoading?: boolean;
}

type ActiveTab = 'all' | 'admin' | 'user';

function RoleBadge({ role }: { role: UserRole }) {
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

function UserAvatar({ name, email }: { name?: string; email: string }) {
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

function InviteUserSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Crear Nuevo Usuario
          </SheetTitle>
          <SheetDescription>
            Solo los administradores pueden crear cuentas. El usuario recibirá sus credenciales por
            correo.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-1.5">
            <Label htmlFor="new-email">Correo electrónico</Label>
            <Input id="new-email" type="email" placeholder="usuario@empresa.com" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-name">Nombre completo</Label>
            <Input id="new-name" type="text" placeholder="Ej: Juan Pérez" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-role">Rol</Label>
            <Select defaultValue="USER">
              <SelectTrigger id="new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Usuario</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-area">Área de trabajo</Label>
            <Input id="new-area" type="text" placeholder="Ej: Taller A, Laboratorio" />
          </div>

          <Separator />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Crear usuario
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const COLUMNS: ColumnDef<AppUser>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Seleccionar todo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label={`Seleccionar ${row.original.name ?? row.original.email}`}
      />
    ),
    enableSorting: false,
  },
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
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.email}</span>,
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
        <span className="text-sm">{row.original.workArea}</span>
      ) : (
        <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
          Sin asignar
        </Badge>
      ),
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Pencil className="h-4 w-4 mr-2" />
            Editar usuario
          </DropdownMenuItem>
          <DropdownMenuItem>
            <KeyRound className="h-4 w-4 mr-2" />
            Restablecer contraseña
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            {row.original.role === 'ADMIN' ? (
              <>
                <User className="h-4 w-4 mr-2" />
                Cambiar a Usuario
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Promover a Admin
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar usuario
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
];

export function UserTable({ users, isLoading = false }: UserTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [workAreaFilter, setWorkAreaFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [inviteOpen, setInviteOpen] = useState(false);

  // Reset page on filter change
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [globalFilter, workAreaFilter, activeTab]);

  const workAreas = useMemo(
    () => Array.from(new Set(users.map((u) => u.workArea).filter(Boolean))).sort() as string[],
    [users],
  );

  // ─────────────────────────────────────────────────────────────────
  // SERVER-SIDE PLACEHOLDER
  // When the API is ready, replace this entire useMemo block with:
  //
  // const { data, isLoading } = trpc.users.list.useQuery({
  //   page: pagination.pageIndex,
  //   pageSize: pagination.pageSize,
  //   search: globalFilter,
  //   role: activeTab === 'all' ? undefined : activeTab.toUpperCase() as UserRole,
  //   workArea: workAreaFilter === 'all' ? undefined : workAreaFilter,
  //   sortBy: sorting[0]?.id ?? 'name',
  //   sortDir: sorting[0]?.desc ? 'desc' : 'asc',
  // });
  // const tableData = data?.data ?? [];
  // const pageCount = data?.pageCount ?? 0;
  //
  // For tab counts: trpc.users.counts.useQuery({ search: globalFilter, workArea: ... })
  // ─────────────────────────────────────────────────────────────────
  const { tableData, pageCount, roleCounts } = useMemo(() => {
    const roleMap: Record<ActiveTab, UserRole | undefined> = {
      all: undefined,
      admin: 'ADMIN',
      user: 'USER',
    };

    const preRole = users.filter((u) => {
      const matchesSearch =
        globalFilter === '' ||
        u.email.toLowerCase().includes(globalFilter.toLowerCase()) ||
        u.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        u.workArea?.toLowerCase().includes(globalFilter.toLowerCase());
      const matchesArea = workAreaFilter === 'all' || u.workArea === workAreaFilter;
      return matchesSearch && matchesArea;
    });

    const roleFilter = roleMap[activeTab];
    const filtered = roleFilter ? preRole.filter((u) => u.role === roleFilter) : preRole;

    const sorted = [...filtered].sort((a, b) => {
      const col = sorting[0];
      if (!col) return 0;
      const av = String(a[col.id as keyof AppUser] ?? '');
      const bv = String(b[col.id as keyof AppUser] ?? '');
      const cmp = av.localeCompare(bv);
      return col.desc ? -cmp : cmp;
    });

    const { pageIndex, pageSize } = pagination;
    const paged = sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

    return {
      tableData: paged,
      pageCount: Math.ceil(sorted.length / pagination.pageSize),
      roleCounts: {
        all: preRole.length,
        admin: preRole.filter((u) => u.role === 'ADMIN').length,
        user: preRole.filter((u) => u.role === 'USER').length,
      },
    };
  }, [users, globalFilter, workAreaFilter, activeTab, sorting, pagination]);

  const table = useReactTable({
    data: tableData,
    columns: COLUMNS,
    pageCount,
    state: { sorting, pagination, rowSelection },
    getRowId: (row) => row.id,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedCount = Object.keys(rowSelection).length;

  const tabItems: Array<{ value: ActiveTab; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'admin', label: 'Administradores' },
    { value: 'user', label: 'Usuarios' },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, correo o área..."
                className="pl-9"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="h-4 w-4" />
                  Filtros
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 p-3" align="start">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Área de Trabajo
                    </p>
                    <Select value={workAreaFilter} onValueChange={setWorkAreaFilter}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Todas las áreas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las áreas</SelectItem>
                        {workAreas.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {workAreaFilter !== 'all' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => setWorkAreaFilter('all')}
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Crear usuario
          </Button>
        </div>

        {/* Batch controls */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
            <span className="text-sm font-medium">{selectedCount} usuario(s) seleccionado(s)</span>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="destructive" size="sm" className="h-7 gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar selección
              </Button>
              <Button variant="ghost" size="sm" className="h-7" onClick={() => setRowSelection({})}>
                Cancelar selección
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
          <TabsList>
            {tabItems.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                {tab.label}
                <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                  {roleCounts[tab.value]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1 hover:text-foreground font-medium"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="text-muted-foreground">
                            {{ asc: '↑', desc: '↓' }[header.column.getIsSorted() as string] ?? '↕'}
                          </span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    {COLUMNS.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMNS.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} totalSelected={selectedCount} />
      </div>

      <InviteUserSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
