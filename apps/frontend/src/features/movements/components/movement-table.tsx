'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  ArrowUpDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  ChevronDown,
  CalendarIcon,
  Eye,
  Package,
  User,
  MapPin,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

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
            {/* Type & Date */}
            <div className="flex items-center justify-between">
              <TypeBadge type={movement.type} />
              <span className="text-sm text-muted-foreground">
                {format(movement.date, 'HH:mm', { locale: es })} hs
              </span>
            </div>

            <Separator />

            {/* Personnel info */}
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

            {/* Items */}
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

export function MovementTable({ movements, isLoading = false }: MovementTableProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Movement>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const projects = Array.from(
    new Set(movements.map((m) => m.project).filter(Boolean)),
  ).sort() as string[];

  const filterMovements = (typeFilter: MovementType | 'ALL') => {
    return movements
      .filter((m) => {
        const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
        const matchesSearch =
          search === '' ||
          m.personalName.toLowerCase().includes(search.toLowerCase()) ||
          m.destination?.toLowerCase().includes(search.toLowerCase()) ||
          m.project?.toLowerCase().includes(search.toLowerCase()) ||
          m.details.some((d) => d.itemName.toLowerCase().includes(search.toLowerCase()));
        const matchesProject = projectFilter === 'all' || m.project === projectFilter;
        return matchesType && matchesSearch && matchesProject;
      })
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (av instanceof Date && bv instanceof Date) {
          return sortAsc ? av.getTime() - bv.getTime() : bv.getTime() - av.getTime();
        }
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortAsc ? cmp : -cmp;
      });
  };

  const toggleSort = (field: keyof Movement) => {
    if (sortField === field) setSortAsc((p) => !p);
    else {
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

  const toggleSelectAll = (visible: Movement[]) => {
    const allSelected = visible.every((m) => selectedIds.has(m.id));
    setSelectedIds(allSelected ? new Set() : new Set(visible.map((m) => m.id)));
  };

  const openDetail = (movement: Movement) => {
    setSelectedMovement(movement);
    setSheetOpen(true);
  };

  const tabItems: Array<{ value: string; label: string; type: MovementType | 'ALL' }> = [
    { value: 'all', label: 'Todos', type: 'ALL' },
    { value: 'entry', label: 'Entradas', type: 'ENTRY' },
    { value: 'exit', label: 'Salidas', type: 'EXIT' },
  ];

  const renderTable = (filtered: Movement[]) => {
    const allSelected = filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));
    const someSelected = filtered.some((m) => selectedIds.has(m.id));

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected && !allSelected ? 'indeterminate' : undefined}
                  onCheckedChange={() => toggleSelectAll(filtered)}
                  aria-label="Seleccionar todo"
                />
              </TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('date')}
                  className="flex items-center gap-1 hover:text-foreground font-medium"
                >
                  Fecha
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('personalName')}
                  className="flex items-center gap-1 hover:text-foreground font-medium"
                >
                  Personal
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead className="text-center">Ítems</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No se encontraron movimientos.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((movement) => (
                <TableRow key={movement.id} data-selected={selectedIds.has(movement.id)}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(movement.id)}
                      onCheckedChange={() => toggleSelect(movement.id)}
                      aria-label={`Seleccionar movimiento`}
                    />
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={movement.type} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{format(movement.date, 'dd/MM/yyyy', { locale: es })}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{movement.personalName}</TableCell>
                  <TableCell>
                    {movement.project ? (
                      <span className="text-sm">{movement.project}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {movement.destination ? (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {movement.destination}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {movement.details.length}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetail(movement)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Exportar registro
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
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
            <span className="text-sm font-medium">
              {selectedIds.size} movimiento(s) seleccionado(s)
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" className="h-7 gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Exportar selección
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => setSelectedIds(new Set())}
              >
                Cancelar selección
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList>
            {tabItems.map((tab) => {
              const count = filterMovements(tab.type).length;
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
              {renderTable(filterMovements(tab.type))}
            </TabsContent>
          ))}
        </Tabs>

        {!isLoading && (
          <p className="text-xs text-muted-foreground px-1">
            Mostrando {filterMovements('ALL').length} de {movements.length} movimientos en total
          </p>
        )}
      </div>

      <MovementDetailSheet
        movement={selectedMovement}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
