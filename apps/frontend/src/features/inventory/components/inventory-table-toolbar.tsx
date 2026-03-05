'use client';

import { useCallback, useState } from 'react';
import { ChevronDown, Download, Filter, ImageOff, Plus, Search, Upload } from 'lucide-react';
import { utils as xlsxUtils, write as xlsxWrite, writeFile as xlsxWriteFile } from 'xlsx';
import { toast } from 'sonner';

import { ItemFormSheet } from './item-form-sheet';
import { ImportExcelDialog } from './import-excel-dialog';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';

import type { ItemCounts } from '@ingexpert/schema';
import { TAB_ITEMS } from './inventory-table.types';

interface InventoryTableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;
  locationOptions: string[];
  imageFilter: string;
  onImageFilterChange: (value: string) => void;
  activeTab: string;
  onTabChange: (value: string) => void;
  typeCounts: ItemCounts;
  isAdmin: boolean;
}

export function InventoryTableToolbar({
  search,
  onSearchChange,
  locationFilter,
  onLocationFilterChange,
  locationOptions,
  imageFilter,
  onImageFilterChange,
  activeTab,
  onTabChange,
  typeCounts,
  isAdmin,
}: InventoryTableToolbarProps) {
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const utils = trpc.useUtils();

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const [items, kitsData] = await Promise.all([
        utils.items.getAll.fetch(),
        utils.kits.getAllWithComponents.fetch(),
      ]);

      const TYPE_ES: Record<string, string> = {
        PRODUCT: 'PRODUCTO',
        EQUIPMENT: 'EQUIPO',
        TOOL: 'HERRAMIENTA',
        KIT: 'KIT',
      };

      // Sheet 1: all items except kits
      const inventoryRows = items
        .filter((item) => item.type !== 'KIT')
        .map((item) => ({
          CODIGO: item.code,
          NOMBRE: item.name,
          UBICACION: item.location,
          STOCK: item.stock,
          UNIDAD: item.unit,
          TIPO: TYPE_ES[item.type] ?? item.type,
        }));

      // Sheet 2: kit compositions (one row per component)
      const kitRows = kitsData.flatMap((kit) =>
        kit.components.map((comp) => ({
          KIT: kit.name,
          CODIGO_KIT: kit.code,
          COMPONENTE: comp.name,
          CODIGO_COMPONENTE: comp.code,
          CANTIDAD: comp.quantity,
          UNIDAD: comp.unit,
        })),
      );

      const wb = xlsxUtils.book_new();
      xlsxUtils.book_append_sheet(wb, xlsxUtils.json_to_sheet(inventoryRows), 'Inventario');
      xlsxUtils.book_append_sheet(wb, xlsxUtils.json_to_sheet(kitRows), 'Kits');

      const date = new Date().toISOString().slice(0, 10);
      const fileName = `inventario_${date}.xlsx`;

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
        const buf = xlsxWrite(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
        const writable = await handle.createWritable();
        await writable.write(buf);
        await writable.close();
      } else {
        xlsxWriteFile(wb, fileName);
      }

      toast.success('Inventario exportado correctamente');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      toast.error('Error al exportar el inventario');
    } finally {
      setIsExporting(false);
    }
  }, [utils]);

  return (
    <div className="space-y-4">
      {/* Search + filter + actions row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar items, codigos, ubicaciones..."
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
            <DropdownMenuContent className="w-60 p-3" align="start">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Ubicación
                  </p>
                  <Select value={locationFilter} onValueChange={onLocationFilterChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todas las ubicaciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las ubicaciones</SelectItem>
                      {locationOptions
                        .filter((loc) => loc && loc !== '-')
                        .map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Imagen
                  </p>
                  <Select value={imageFilter} onValueChange={onImageFilterChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="has">Con imagen</SelectItem>
                      <SelectItem value="missing">
                        <span className="flex items-center gap-1.5">
                          <ImageOff className="h-3.5 w-3.5 text-muted-foreground" />
                          Sin imagen
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(locationFilter !== 'all' || imageFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => {
                      onLocationFilterChange('all');
                      onImageFilterChange('all');
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
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="h-4 w-4" />
                Importar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => void handleExport()}
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exportando...' : 'Exportar'}
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setAddItemOpen(true)}>
                <Plus className="h-4 w-4" />
                Agregar item
              </Button>
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <>
          <ItemFormSheet mode="create" open={addItemOpen} onClose={() => setAddItemOpen(false)} />
          <ImportExcelDialog open={importOpen} onClose={() => setImportOpen(false)} />
        </>
      )}

      {/* Type tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList>
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                {typeCounts[tab.type as keyof ItemCounts]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
