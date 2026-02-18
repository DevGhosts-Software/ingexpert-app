'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Download,
  MoreHorizontal,
  ArrowUpDown,
  Package,
  Wrench,
  Hammer,
  Boxes,
  MapPin,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

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

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading?: boolean;
}

const typeConfig: Record<
  ItemType,
  { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' }
> = {
  PRODUCT: { label: 'Producto', icon: Package, variant: 'default' },
  EQUIPMENT: { label: 'Equipo', icon: Wrench, variant: 'secondary' },
  TOOL: { label: 'Herramienta', icon: Hammer, variant: 'outline' },
  KIT: { label: 'Kit', icon: Boxes, variant: 'secondary' },
};

const LOW_STOCK_THRESHOLD = 10;

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge variant="destructive">Sin stock</Badge>;
  }
  if (stock < LOW_STOCK_THRESHOLD) {
    return (
      <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">
        Stock bajo
      </Badge>
    );
  }
  return <Badge variant="outline">En stock</Badge>;
}

function ItemTypeBadge({ type }: { type: ItemType }) {
  const config = typeConfig[type];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1 font-normal">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function InventoryTable({ items, isLoading = false }: InventoryTableProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof InventoryItem>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const locations = Array.from(new Set(items.map((i) => i.location))).sort();

  const filterItems = (typeFilter: ItemType | 'ALL') => {
    return items
      .filter((item) => {
        const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
        const matchesSearch =
          search === '' ||
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.location.toLowerCase().includes(search.toLowerCase());
        const matchesLocation = locationFilter === 'all' || item.location === locationFilter;
        const matchesStock =
          stockFilter === 'all' ||
          (stockFilter === 'low' && item.stock > 0 && item.stock < LOW_STOCK_THRESHOLD) ||
          (stockFilter === 'out' && item.stock === 0) ||
          (stockFilter === 'ok' && item.stock >= LOW_STOCK_THRESHOLD);
        return matchesType && matchesSearch && matchesLocation && matchesStock;
      })
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortAsc ? cmp : -cmp;
      });
  };

  const toggleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = (visibleItems: InventoryItem[]) => {
    const allSelected = visibleItems.every((i) => selectedIds.has(i.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleItems.map((i) => i.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const tabItems: Array<{ value: string; label: string; type: ItemType | 'ALL' }> = [
    { value: 'all', label: 'Todos', type: 'ALL' },
    { value: 'product', label: 'Productos', type: 'PRODUCT' },
    { value: 'equipment', label: 'Equipos', type: 'EQUIPMENT' },
    { value: 'tool', label: 'Herramientas', type: 'TOOL' },
    { value: 'kit', label: 'Kits', type: 'KIT' },
  ];

  const renderTable = (filteredItems: InventoryItem[]) => {
    const allSelected =
      filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));
    const someSelected = filteredItems.some((i) => selectedIds.has(i.id));

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected && !allSelected ? 'indeterminate' : undefined}
                  onCheckedChange={() => toggleSelectAll(filteredItems)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('name')}
                  className="flex items-center gap-1 hover:text-foreground font-medium"
                >
                  Nombre
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('location')}
                  className="flex items-center gap-1 hover:text-foreground font-medium"
                >
                  Ubicación
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('stock')}
                  className="flex items-center gap-1 hover:text-foreground font-medium"
                >
                  Stock
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No se encontraron ítems.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} data-selected={selectedIds.has(item.id)}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      aria-label={`Select ${item.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <ItemTypeBadge type={item.type} />
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {item.stock} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StockBadge stock={item.stock} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                        <DropdownMenuItem>Editar ítem</DropdownMenuItem>
                        <DropdownMenuItem>Ajustar stock</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Marcar para baja
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ítems, ubicaciones..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                    Ubicación
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
                  <Select value={stockFilter} onValueChange={setStockFilter}>
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
                {(locationFilter !== 'all' || stockFilter !== 'all') && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => {
                        setLocationFilter('all');
                        setStockFilter('all');
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  </>
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
            Agregar ítem
          </Button>
        </div>
      </div>

      {/* Batch controls */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <span className="text-sm font-medium">{selectedIds.size} ítem(s) seleccionado(s)</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="h-7 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Exportar selección
            </Button>
            <Button variant="destructive" size="sm" className="h-7 gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Dar de baja en lote
            </Button>
            <Button variant="ghost" size="sm" className="h-7" onClick={clearSelection}>
              Cancelar selección
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          {tabItems.map((tab) => {
            const count = filterItems(tab.type).length;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                {tab.label}
                <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabItems.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {renderTable(filterItems(tab.type))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Footer info */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground px-1">
          Mostrando {filterItems('ALL').length} de {items.length} ítems en total
        </p>
      )}
    </div>
  );
}
