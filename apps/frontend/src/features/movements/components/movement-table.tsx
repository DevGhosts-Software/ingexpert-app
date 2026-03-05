'use client';

import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarIcon,
  ChevronDown,
  Filter,
  Plus,
  Search,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { DatePicker } from '@/components/ui/date-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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

import { getColumns, MOVEMENT_ROW_ACCENT } from './movement-table.columns';
import { MovementDetailSheet } from './movement-detail-sheet';
import { MovementFormSheet } from './movement-form-sheet';
import type { ActiveTab, MovementRow, TypeCounts } from './movement-table.types';

type ProjectOption = { id: string; name: string };
type UserOption = { id: string; name: string | null; email: string };

interface MovementTableProps {
  movements: MovementRow[];
  isLoading: boolean;
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: ActiveTab;
  onTypeFilterChange: (v: ActiveTab) => void;
  projectFilter: string;
  onProjectFilterChange: (v: string) => void;
  projects: ProjectOption[];
  typeCounts: TypeCounts;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  // Role-aware filter props
  isAdmin: boolean;
  users: UserOption[];
  creatorFilter: string;
  onCreatorFilterChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
}

const TAB_ITEMS: Array<{ value: ActiveTab; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'purchase', label: 'Compras' },
  { value: 'return', label: 'Devoluciones' },
  { value: 'exit', label: 'Salidas' },
  { value: 'writeoff', label: 'Bajas' },
];

export function MovementTable({
  movements,
  isLoading,
  pageCount,
  pagination,
  onPaginationChange,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  projectFilter,
  onProjectFilterChange,
  projects,
  typeCounts,
  sorting,
  onSortingChange,
  isAdmin,
  users,
  creatorFilter,
  onCreatorFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: MovementTableProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const columns = useMemo<ColumnDef<MovementRow>[]>(() => getColumns(), []);

  const table = useReactTable({
    data: movements,
    columns,
    pageCount,
    state: { sorting, pagination },
    getRowId: (row) => row.id,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onSortingChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  // Count active filters for badge
  const activeFilterCount = [
    projectFilter !== 'all',
    isAdmin && creatorFilter !== 'all',
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onProjectFilterChange('all');
    if (isAdmin) onCreatorFilterChange('all');
    onDateFromChange('');
    onDateToChange('');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por personal, destino o proyecto..."
              className="pl-9"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs font-mono">
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-3" align="start">
              <div className="space-y-4">
                {/* Date range */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> Rango de fechas
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Desde</p>
                    <DatePicker
                      value={dateFrom}
                      onChange={onDateFromChange}
                      placeholder="Fecha inicio"
                      maxDate={dateTo ? new Date(dateTo + 'T12:00:00') : undefined}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Hasta</p>
                    <DatePicker
                      value={dateTo}
                      onChange={onDateToChange}
                      placeholder="Fecha fin"
                      minDate={dateFrom ? new Date(dateFrom + 'T12:00:00') : undefined}
                    />
                  </div>
                </div>

                <Separator />

                {/* Project */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Proyecto
                  </p>
                  <Select value={projectFilter} onValueChange={onProjectFilterChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todos los proyectos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los proyectos</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Creator — admin only */}
                {isAdmin && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Creado por
                    </p>
                    <Select value={creatorFilter} onValueChange={onCreatorFilterChange}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Todos los usuarios" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los usuarios</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name ?? u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {activeFilterCount > 0 && (
                  <>
                    <Separator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs gap-1"
                      onClick={clearFilters}
                    >
                      <X className="h-3 w-3" /> Limpiar filtros
                    </Button>
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Registrar movimiento
        </Button>
      </div>

      {/* Create sheet */}
      <MovementFormSheet open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Row detail sheet */}
      <MovementDetailSheet
        movementId={detailId ?? ''}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />

      {/* Tabs */}
      <Tabs value={typeFilter} onValueChange={(v) => onTypeFilterChange(v as ActiveTab)}>
        <TabsList>
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                {typeCounts[tab.value]}
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
                  <TableHead key={header.id} className={(header.column.columnDef.meta as { width?: string } | undefined)?.width}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div className={(header.column.columnDef.meta as { center?: boolean } | undefined)?.center ? 'flex justify-center' : ''}>
                        <button
                          onClick={() =>
                            header.column.toggleSorting(header.column.getIsSorted() === 'asc')
                          }
                          className="group flex items-center gap-1 hover:text-foreground font-medium"
                        >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                        )}
                        </button>
                      </div>
                    ) : (header.column.columnDef.meta as { center?: boolean } | undefined)?.center ? (
                      <div className="flex justify-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
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
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No se encontraron movimientos.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  style={{ boxShadow: MOVEMENT_ROW_ACCENT[row.original.type] }}
                  onClick={() => setDetailId(row.original.id)}
                >
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

      <DataTablePagination table={table} />
    </div>
  );
}
