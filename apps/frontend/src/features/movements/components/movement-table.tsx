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
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarIcon,
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  Filter,
  MapPin,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export type MovementType = 'ENTRY' | 'EXIT';

export interface MovementDetail {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
}

export interface Movement {
  id: string;
  type: MovementType;
  personalName: string;
  destination?: string;
  responsibleDelivery?: string;
  responsibleReceipt?: string;
  project?: string;
  date: Date;
  details: MovementDetail[];
}

interface MovementTableProps {
  movements: Movement[];
  isLoading?: boolean;
}

type ActiveTab = 'all' | 'entry' | 'exit';

function TypeBadge({ type }: { type: MovementType }) {
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

function MovementDetailSheet({
  movement,
  open,
  onClose,
}: {
  movement: Movement | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!movement) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Detalle del Movimiento
          </SheetTitle>
          <SheetDescription>
            Registro #{movement.id.slice(0, 8).toUpperCase()} —{' '}
            {format(movement.date, "dd 'de' MMMM 'de' yyyy", { locale: es })}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)] mt-6">
          <div className="space-y-6 pr-4">
            <div className="flex items-center justify-between">
              <TypeBadge type={movement.type} />
              <span className="text-sm text-muted-foreground">
                {format(movement.date, 'HH:mm', { locale: es })} hs
              </span>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Personal
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Personal:</span>
                  <span className="font-medium">{movement.personalName}</span>
                </div>
                {movement.responsibleDelivery && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Resp. entrega:</span>
                    <span className="font-medium">{movement.responsibleDelivery}</span>
                  </div>
                )}
                {movement.responsibleReceipt && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Resp. recepción:</span>
                    <span className="font-medium">{movement.responsibleReceipt}</span>
                  </div>
                )}
                {movement.destination && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Destino:</span>
                    <span className="font-medium">{movement.destination}</span>
                  </div>
                )}
                {movement.project && (
                  <div className="flex items-center gap-2 text-sm">
                    <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Proyecto:</span>
                    <span className="font-medium">{movement.project}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Ítems ({movement.details.length})
              </h4>
              <div className="space-y-2">
                {movement.details.map((detail) => (
                  <div
                    key={detail.itemId}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{detail.itemName}</span>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">
                      {detail.quantity} {detail.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function buildColumns(onView: (m: Movement) => void): ColumnDef<Movement>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Seleccionar todo"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Seleccionar movimiento"
        />
      ),
      enableSorting: false,
    },
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
        <div className="flex items-center gap-1.5 text-sm">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{format(row.original.date, 'dd/MM/yyyy', { locale: es })}</span>
        </div>
      ),
    },
    {
      accessorKey: 'personalName',
      header: 'Personal',
      cell: ({ row }) => <span className="font-medium">{row.original.personalName}</span>,
    },
    {
      accessorKey: 'project',
      header: 'Proyecto',
      cell: ({ row }) =>
        row.original.project ? (
          <span className="text-sm">{row.original.project}</span>
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
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {row.original.destination}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
      enableSorting: false,
    },
    {
      id: 'itemCount',
      header: () => <span className="block text-center">Ítems</span>,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="secondary" className="font-mono text-xs">
            {row.original.details.length}
          </Badge>
        </div>
      ),
      enableSorting: false,
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
            <DropdownMenuItem onClick={() => onView(row.original)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Exportar registro
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
    },
  ];
}

export function MovementTable({ movements, isLoading = false }: MovementTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Reset page on filter change
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [globalFilter, projectFilter, activeTab]);

  const projects = useMemo(
    () => Array.from(new Set(movements.map((m) => m.project).filter(Boolean))).sort() as string[],
    [movements],
  );

  // ─────────────────────────────────────────────────────────────────
  // SERVER-SIDE PLACEHOLDER
  // When the API is ready, replace this entire useMemo block with:
  //
  // const { data, isLoading } = trpc.movements.list.useQuery({
  //   page: pagination.pageIndex,
  //   pageSize: pagination.pageSize,
  //   search: globalFilter,
  //   type: activeTab === 'all' ? undefined : activeTab.toUpperCase() as MovementType,
  //   project: projectFilter === 'all' ? undefined : projectFilter,
  //   sortBy: sorting[0]?.id ?? 'date',
  //   sortDir: sorting[0]?.desc ? 'desc' : 'asc',
  // });
  // const tableData = data?.data ?? [];
  // const pageCount = data?.pageCount ?? 0;
  //
  // For tab counts: trpc.movements.counts.useQuery({ search: globalFilter, project: ... })
  // ─────────────────────────────────────────────────────────────────
  const { tableData, pageCount, typeCounts } = useMemo(() => {
    const typeMap: Record<ActiveTab, MovementType | undefined> = {
      all: undefined,
      entry: 'ENTRY',
      exit: 'EXIT',
    };

    const preType = movements.filter((m) => {
      const matchesSearch =
        globalFilter === '' ||
        m.personalName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        m.destination?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        m.project?.toLowerCase().includes(globalFilter.toLowerCase()) ||
        m.details.some((d) => d.itemName.toLowerCase().includes(globalFilter.toLowerCase()));
      const matchesProject = projectFilter === 'all' || m.project === projectFilter;
      return matchesSearch && matchesProject;
    });

    const typeFilter = typeMap[activeTab];
    const filtered = typeFilter ? preType.filter((m) => m.type === typeFilter) : preType;

    const sorted = [...filtered].sort((a, b) => {
      const col = sorting[0];
      if (!col) return 0;
      if (col.id === 'date') {
        return col.desc ? b.date.getTime() - a.date.getTime() : a.date.getTime() - b.date.getTime();
      }
      const av = String(a[col.id as keyof Movement] ?? '');
      const bv = String(b[col.id as keyof Movement] ?? '');
      const cmp = av.localeCompare(bv);
      return col.desc ? -cmp : cmp;
    });

    const { pageIndex, pageSize } = pagination;
    const paged = sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

    return {
      tableData: paged,
      pageCount: Math.ceil(sorted.length / pagination.pageSize),
      typeCounts: {
        all: preType.length,
        entry: preType.filter((m) => m.type === 'ENTRY').length,
        exit: preType.filter((m) => m.type === 'EXIT').length,
      },
    };
  }, [movements, globalFilter, projectFilter, activeTab, sorting, pagination]);

  const openDetail = (movement: Movement) => {
    setSelectedMovement(movement);
    setSheetOpen(true);
  };

  const columns = useMemo(() => buildColumns(openDetail), []);

  const table = useReactTable({
    data: tableData,
    columns,
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
    { value: 'entry', label: 'Entradas' },
    { value: 'exit', label: 'Salidas' },
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
                placeholder="Buscar por personal, destino, proyecto o ítem..."
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
                      Proyecto
                    </p>
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Todos los proyectos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los proyectos</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {projectFilter !== 'all' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => setProjectFilter('all')}
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Registrar movimiento
            </Button>
          </div>
        </div>

        {/* Batch controls */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
            <span className="text-sm font-medium">
              {selectedCount} movimiento(s) seleccionado(s)
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" className="h-7 gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Exportar selección
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

      <MovementDetailSheet
        movement={selectedMovement}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
