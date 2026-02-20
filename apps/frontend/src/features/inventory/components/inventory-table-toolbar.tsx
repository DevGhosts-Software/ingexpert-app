'use client';

import { ChevronDown, Download, Filter, Plus, Search, Trash2 } from 'lucide-react';

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

import { type ItemType, type TypeCounts, TAB_ITEMS } from './inventory-table.types';

interface InventoryTableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;
  locationOptions: string[];
  stockLevelFilter: string;
  onStockLevelFilterChange: (value: string) => void;
  activeTab: string;
  onTabChange: (value: string) => void;
  typeCounts: TypeCounts;
  totalSelected: number;
  onClearSelection: () => void;
}

export function InventoryTableToolbar({
  search,
  onSearchChange,
  locationFilter,
  onLocationFilterChange,
  locationOptions,
  stockLevelFilter,
  onStockLevelFilterChange,
  activeTab,
  onTabChange,
  typeCounts,
  totalSelected,
  onClearSelection,
}: InventoryTableToolbarProps) {
  return (
    <div className="space-y-4">
      {/* Search + filter + actions row */}
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
                  <Select value={stockLevelFilter} onValueChange={onStockLevelFilterChange}>
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
                      onStockLevelFilterChange('all');
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

      {/* Bulk action bar */}
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
            <Button variant="ghost" size="sm" className="h-7" onClick={onClearSelection}>
              Cancelar seleccion
            </Button>
          </div>
        </div>
      )}

      {/* Type tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList>
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                {typeCounts[tab.type as keyof TypeCounts]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
