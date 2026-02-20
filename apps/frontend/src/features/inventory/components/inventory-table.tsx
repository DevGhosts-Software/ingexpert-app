'use client';

import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  type OnChangeFn,
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

export interface InventoryTableProps {
  items: InventoryItem[];
  isLoading?: boolean;
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: ItemType | 'ALL';
  onTypeFilterChange: (value: ItemType | 'ALL') => void;
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;
  typeCounts: { ALL: number; PRODUCT: number; EQUIPMENT: number; TOOL: number; KIT: number };
  allLocations?: string[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}

export function InventoryTable({
  items,
  isLoading = false,
  pageCount,
  pagination,
  onPaginationChange,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  locationFilter,
  onLocationFilterChange,
  typeCounts,
  allLocations,
  sorting,
  onSortingChange,
}: InventoryTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [stockLevelFilter, setStockLevelFilter] = useState('all');

  // Client-side stock level filter (API does not support range queries)
  const filteredItems = useMemo(() => {
    if (stockLevelFilter === 'all') return items;
    if (stockLevelFilter === 'low') return items.filter((i) => i.stock > 0 && i.stock < LOW_STOCK_THRESHOLD);
    if (stockLevelFilter === 'out') return items.filter((i) => i.stock === 0);
    if (stockLevelFilter === 'ok') return items.filter((i) => i.stock >= LOW_STOCK_THRESHOLD);
    return items;
  }, [items, stockLevelFilter]);

  // Distinct locations from current page for the filter dropdown
  const locations = useMemo(
    () => Array.from(new Set(items.map((i) => i.location))).sort(),
    [items],
  );

  // Prefer server-provided full location list; fall back to current page locations
  const locationOptions = allLocations && allLocations.length > 0 ? allLocations : locations;

  const activeTab = typeFilter === 'ALL' ? 'all' : typeFilter.toLowerCase();

  const table = useReactTable({
    data: filteredItems,
    columns: COLUMNS,
    pageCount,
    state: { sorting, rowSelection, pagination },
    onSortingChange,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const totalSelected = Object.keys(rowSelection).length;

  const handleTabChange = (value: string) => {
    const typeMap: Record<string, ItemType | 'ALL'> = {
      all: 'ALL',
      product: 'PRODUCT',
      equipment: 'EQUIPMENT',
      tool: 'TOOL',
      kit: 'KIT',
    };
    onTypeFilterChange(typeMap[value] ?? 'ALL');
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
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
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
                  <Select value={locationFilter} onValueChange={onLocationFilterChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todas las ubicaciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las ubicaciones</SelectItem>
                      {locationOptions.map((loc) => (
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
                      onLocationFilterChange('all');
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

      <DataTablePagination
        table={table}
        totalSelected={totalSelected}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        pageCount={pageCount}
        onPageSizeChange={(size) => onPaginationChange({ ...pagination, pageSize: size, pageIndex: 0 })}
      />
    </div>
  );
}
