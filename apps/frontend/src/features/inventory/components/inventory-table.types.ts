import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { Boxes, Hammer, Package, Wrench } from 'lucide-react';
import type { ItemCounts, ItemEntity, ItemType } from '@ingexpert/schema';

// Re-export shared entity types so callers within this feature only need one import
export type { ItemEntity as InventoryItem } from '@ingexpert/schema';
export type { ItemType } from '@ingexpert/schema';


export const TYPE_CONFIG: Record<
  ItemType,
  { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' }
> = {
  PRODUCT: { label: 'Producto', icon: Package, variant: 'default' },
  EQUIPMENT: { label: 'Equipo', icon: Wrench, variant: 'secondary' },
  TOOL: { label: 'Herramienta', icon: Hammer, variant: 'outline' },
  KIT: { label: 'Kit', icon: Boxes, variant: 'secondary' },
};

export const TYPE_COLORS: Record<
  ItemType,
  { bg: string; border: string; badge: string; description: string }
> = {
  PRODUCT: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Bien de consumo',
  },
  EQUIPMENT: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    badge:
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
    description: 'Activo fijo o maquinaria',
  },
  TOOL: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    badge:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
    description: 'Herramienta manual o eléctrica',
  },
  KIT: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400',
    description: 'Conjunto de ítems agrupados',
  },
};

export const TAB_ITEMS: Array<{ value: string; label: string; type: ItemType | 'ALL' }> = [
  { value: 'all', label: 'Todos', type: 'ALL' },
  { value: 'product', label: 'Productos', type: 'PRODUCT' },
  { value: 'equipment', label: 'Equipos', type: 'EQUIPMENT' },
  { value: 'tool', label: 'Herramientas', type: 'TOOL' },
  { value: 'kit', label: 'Kits', type: 'KIT' },
];

export interface InventoryTableProps {
  items: ItemEntity[];
  isLoading?: boolean;
  isAdmin: boolean;
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: ItemType | 'ALL';
  onTypeFilterChange: (value: ItemType | 'ALL') => void;
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;
  typeCounts: ItemCounts;
  allLocations?: string[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onRowClick: (item: ItemEntity) => void;
}
