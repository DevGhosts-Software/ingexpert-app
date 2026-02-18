'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Boxes,
  ChevronDown,
  Download,
  Filter,
  Hammer,
  MapPin,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export type ItemType = 'PRODUCT' | 'EQUIPMENT' | 'TOOL' | 'KIT';

export interface InventoryItem {
  id: string;
  name: string;
  location: string;
  stock: number;
  unit: string;
  type: ItemType;
  imageUrl: string;
}

const LOW_STOCK_THRESHOLD = 10;

const TYPE_CONFIG: Record<
  ItemType,
  { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' }
> = {
  PRODUCT: { label: 'Producto', icon: Package, variant: 'default' },
  EQUIPMENT: { label: 'Equipo', icon: Wrench, variant: 'secondary' },
  TOOL: { label: 'Herramienta', icon: Hammer, variant: 'outline' },
  KIT: { label: 'Kit', icon: Boxes, variant: 'secondary' },
};

const TAB_ITEMS: Array<{ value: string; label: string; type: ItemType | 'ALL' }> = [
  { value: 'all', label: 'Todos', type: 'ALL' },
  { value: 'product', label: 'Productos', type: 'PRODUCT' },
  { value: 'equipment', label: 'Equipos', type: 'EQUIPMENT' },
  { value: 'tool', label: 'Herramientas', type: 'TOOL' },
  { value: 'kit', label: 'Kits', type: 'KIT' },
];

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
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
      </svg>
    </button>
  );
}

const COLUMNS: ColumnDef<InventoryItem>[] = [
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
      <ColHeader
        label="Nombre"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
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
      <ColHeader
        label="Ubicacion"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
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
      <ColHeader
        label="Stock"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
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

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading?: boolean;
}

export function InventoryTable({ items, isLoading = false }: InventoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [activeTab, setActiveTab] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [stockLevelFilter, setStockLevelFilter] = useState('all');

  const locations = useMemo(
    () => Array.from(new Set(items.map((i) => i.location))).sort(),
    [items],
  );

  // SERVER-SIDE PLACEHOLDER
  // Replace this useMemo with a tRPC query when the API is ready:
  //
  // const { data: result, isLoading } = trpc.inventory.list.useQuery({
  //   page: pagination.pageIndex + 1,
  //   pageSize: pagination.pageSize,
  //   search: globalFilter,
  //   type: (columnFilters.find(f => f.id === 'type')?.value as ItemType) ?? undefined,
  //   location: locationFilter !== 'all' ? locationFilter : undefined,
  //   stockLevel: stockLevelFilter !== 'all' ? stockLevelFilter : undefined,
  //   orderBy: sorting[0]?.id,
  //   orderDir: sorting[0]?.desc ? 'desc' : 'asc',
  // });
  // const tableData = result?.data ?? [];
  // const total    = result?.total ?? 0;
  // For tab counts: trpc.inventory.counts.useQuery({ search, location, stockLevel })
  const { tableData, total, typeCounts } = useMemo(() => {
    const typeFilter = columnFilters.find((f) => f.id === 'type')?.value as ItemType | undefined;

    const preType = items.filter((item) => {
      if (locationFilter !== 'all' && item.location !== locationFilter) return false;
      if (stockLevelFilter === 'low' && !(item.stock > 0 && item.stock < LOW_STOCK_THRESHOLD))
        return false;
      if (stockLevelFilter === 'out' && item.stock !== 0) return false;
      if (stockLevelFilter === 'ok' && item.stock < LOW_STOCK_THRESHOLD) return false;
      if (globalFilter) {
        const q = globalFilter.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
      }
      return true;
    });

    const typeCounts = {
      ALL: preType.length,
      PRODUCT: preType.filter((i) => i.type === 'PRODUCT').length,
      EQUIPMENT: preType.filter((i) => i.type === 'EQUIPMENT').length,
      TOOL: preType.filter((i) => i.type === 'TOOL').length,
      KIT: preType.filter((i) => i.type === 'KIT').length,
    };

    let filtered = typeFilter ? preType.filter((i) => i.type === typeFilter) : preType;

    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      filtered = [...filtered].sort((a, b) => {
        const av = String(a[id as keyof InventoryItem] ?? '');
        const bv = String(b[id as keyof InventoryItem] ?? '');
        const cmp = av.localeCompare(bv, undefined, { numeric: true });
        return desc ? -cmp : cmp;
      });
    }

    const total = filtered.length;
    const start = pagination.pageIndex * pagination.pageSize;
    return { tableData: filtered.slice(start, start + pagination.pageSize), total, typeCounts };
  }, [items, globalFilter, columnFilters, locationFilter, stockLevelFilter, sorting, pagination]);

  const table = useReactTable({
    data: tableData,
    columns: COLUMNS,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    state: { sorting, columnFilters, globalFilter, rowSelection, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [globalFilter, columnFilters, locationFilter, stockLevelFilter]);

  const totalSelected = Object.keys(rowSelection).length;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const typeMap: Record<string, ItemType | undefined> = {
      all: undefined,
      product: 'PRODUCT',
      equipment: 'EQUIPMENT',
      tool: 'TOOL',
      kit: 'KIT',
    };
    table.getColumn('type')?.setFilterValue(typeMap[value]);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar items, ubicaciones..."
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
            <DropdownMenuContent className="w-56 p-3" align="start">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Ubicacion
                  </p>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todas las ubicaciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las ubicaciones</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Nivel de Stock
                  </p>
                  <Select value={stockLevelFilter} onValueChange={setStockLevelFilter}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todos los niveles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los niveles</SelectItem>
                      <SelectItem value="ok">En stock</SelectItem>
                      <SelectItem value="low">Stock bajo</SelectItem>
                      <SelectItem value="out">Sin stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(locationFilter !== 'all' || stockLevelFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => {
                      setLocationFilter('all');
                      setStockLevelFilter('all');
                    }}
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
            Agregar item
          </Button>
        </div>
      </div>

      {totalSelected > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium">{totalSelected} item(s) seleccionado(s)</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="h-7 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Exportar seleccion
            </Button>
            <Button variant="destructive" size="sm" className="h-7 gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Dar de baja en lote
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => table.resetRowSelection()}
            >
              Cancelar seleccion
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                {typeCounts[tab.type as keyof typeof typeCounts]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
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
                  No se encontraron items.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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

      <DataTablePagination table={table} totalSelected={totalSelected} />
    </div>
  );
}
