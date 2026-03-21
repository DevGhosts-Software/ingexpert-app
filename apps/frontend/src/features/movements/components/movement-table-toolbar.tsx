'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { utils as xlsxUtils, write as xlsxWrite, writeFile as xlsxWriteFile } from 'xlsx';
import {
  CalendarIcon,
  ChevronDown,
  Download,
  Filter,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  ActiveTab,
  MovementExportDetailRow,
  MovementRow,
  TypeCounts,
} from './movement-table.types';

const TAB_ITEMS: Array<{ value: ActiveTab; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'purchase', label: 'Compras' },
  { value: 'return', label: 'Devoluciones' },
  { value: 'exit', label: 'Salidas' },
  { value: 'writeoff', label: 'Bajas' },
];

type ProjectOption = { id: string; name: string };
type UserOption = { id: string; name: string | null; email: string };

interface MovementTableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: ActiveTab;
  onTypeFilterChange: (value: ActiveTab) => void;
  projectFilter: string;
  onProjectFilterChange: (value: string) => void;
  projects: ProjectOption[];
  typeCounts: TypeCounts;
  isAdmin: boolean;
  users: UserOption[];
  creatorFilter: string;
  onCreatorFilterChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  exportMovements: MovementRow[];
  exportDetails: MovementExportDetailRow[];
  selectedIds: Set<string>;
  selectedCount: number;
  hasSelection: boolean;
  globalSelectionChecked: boolean;
  globalSelectionIndeterminate: boolean;
  onToggleGlobalSelection: () => void;
  onCreate: () => void;
}

function formatExportType(movement: MovementRow): string {
  const normalizedObservations = movement.observations?.toLowerCase().trim() ?? '';
  if (normalizedObservations.includes('importación de stock desde excel')) {
    return 'Importación desde Excel';
  }

  switch (movement.type) {
    case 'PURCHASE':
      return 'Compra';
    case 'RETURN':
      return 'Devolución';
    case 'EXIT':
      return 'Salida';
    case 'WRITEOFF':
      return 'Baja';
    case 'STOCK_ADJUSTMENT_IN':
      return 'Ajuste de stock (entrada)';
    case 'STOCK_ADJUSTMENT_OUT':
      return 'Ajuste de stock (salida)';
    default:
      return movement.type;
  }
}

export const MovementTableToolbar = memo(function MovementTableToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  projectFilter,
  onProjectFilterChange,
  projects,
  typeCounts,
  isAdmin,
  users,
  creatorFilter,
  onCreatorFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  exportMovements,
  exportDetails,
  selectedIds,
  selectedCount,
  hasSelection,
  globalSelectionChecked,
  globalSelectionIndeterminate,
  onToggleGlobalSelection,
  onCreate,
}: MovementTableToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);

  const selectedExportMovements = useMemo(
    () => exportMovements.filter((movement) => selectedIds.has(movement.id)),
    [exportMovements, selectedIds],
  );

  const selectedExportIds = useMemo(
    () => new Set(selectedExportMovements.map((movement) => movement.id)),
    [selectedExportMovements],
  );

  const selectedExportDetails = useMemo(
    () => exportDetails.filter((detail) => selectedExportIds.has(detail.movementId)),
    [exportDetails, selectedExportIds],
  );

  const activeFilterCount = [
    projectFilter !== 'all',
    isAdmin && creatorFilter !== 'all',
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    onProjectFilterChange('all');
    if (isAdmin) {
      onCreatorFilterChange('all');
    }
    onDateFromChange('');
    onDateToChange('');
  }, [
    isAdmin,
    onCreatorFilterChange,
    onDateFromChange,
    onDateToChange,
    onProjectFilterChange,
  ]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const exportSourceMovements = hasSelection ? selectedExportMovements : exportMovements;
      const exportSourceIds = new Set(exportSourceMovements.map((movement) => movement.id));
      const exportSourceDetails = hasSelection
        ? selectedExportDetails
        : exportDetails.filter((detail) => exportSourceIds.has(detail.movementId));

      const movementRows = exportSourceMovements.map((movement) => ({
        ID: movement.id,
        FECHA: movement.date,
        TIPO: formatExportType(movement),
        REGISTRADO_POR: movement.creatorName ?? '',
        PROYECTO: movement.projectName ?? '',
        DESTINO: movement.destination ?? '',
        ENTREGADO_POR: movement.responsibleDeliveryName ?? '',
        RECIBIDO_POR: movement.responsibleReceiptName ?? '',
        OBSERVACIONES: movement.observations ?? '',
        ITEMS: movement.itemsCount,
      }));

      const detailRows = exportSourceDetails.map((detail) => ({
        MOVIMIENTO_ID: detail.movementId,
        FECHA: detail.movementDate,
        TIPO: detail.movementType,
        ITEM_CODIGO: detail.itemCode,
        ITEM_NOMBRE: detail.itemName,
        CANTIDAD: detail.quantity,
        UNIDAD: detail.unit,
        OBSERVACIONES: detail.movementObservations ?? '',
      }));

      const workbook = xlsxUtils.book_new();
      xlsxUtils.book_append_sheet(
        workbook,
        xlsxUtils.json_to_sheet(movementRows),
        'Movimientos',
      );
      xlsxUtils.book_append_sheet(
        workbook,
        xlsxUtils.json_to_sheet(detailRows),
        'Detalles',
      );

      const date = new Date().toISOString().slice(0, 10);
      const fileName = `movimientos_${date}.xlsx`;

      if (typeof window.showSaveFilePicker === 'function') {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'Excel Workbook',
              accept: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              },
            },
          ],
        });
        const buffer = xlsxWrite(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
        const writable = await handle.createWritable();
        await writable.write(buffer);
        await writable.close();
      } else {
        xlsxWriteFile(workbook, fileName);
      }

      toast.success(
        hasSelection
          ? 'Movimientos seleccionados exportados correctamente'
          : 'Movimientos exportados correctamente',
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      toast.error('Error al exportar los movimientos');
    } finally {
      setIsExporting(false);
    }
  }, [
    exportDetails,
    exportMovements,
    hasSelection,
    selectedExportDetails,
    selectedExportMovements,
  ]);

  const exportButtonLabel =
    hasSelection && selectedCount === exportMovements.length && exportMovements.length > 0
      ? 'Exportar (Todos)'
      : hasSelection
        ? `Exportar (${selectedCount})`
        : 'Exportar';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por personal, destino o proyecto..."
              className="pl-9"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
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
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name ?? user.email}
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void handleExport()}
            disabled={isExporting}
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : exportButtonLabel}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Registrar movimiento
          </Button>
        </div>
      </div>

      <Tabs value={typeFilter} onValueChange={(value) => onTypeFilterChange(value as ActiveTab)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

          {hasSelection ? (
            <label className="flex items-center gap-3 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm font-medium">
              <Checkbox
                checked={
                  globalSelectionChecked
                    ? true
                    : globalSelectionIndeterminate
                      ? 'indeterminate'
                      : false
                }
                onCheckedChange={() => onToggleGlobalSelection()}
                aria-label="Seleccionar todos los elementos existentes"
                className="size-5"
              />
              <span>¿Seleccionar todos los elementos existentes?</span>
            </label>
          ) : null}
        </div>
      </Tabs>
    </div>
  );
});
