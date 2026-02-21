import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { Boxes, Hammer, Package, Wrench } from 'lucide-react';
import type { ItemCounts, ItemEntity, ItemType } from '@ingexpert/schema';

// Re-export shared entity types so callers within this feature only need one import
export type { ItemEntity as InventoryItem } from '@ingexpert/schema';
export type { ItemType } from '@ingexpert/schema';

export const LOW_STOCK_THRESHOLD = 10;

export const TYPE_CONFIG: Record<
  ItemType,
  { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' }
> = {
  PRODUCT: { label: 'Producto', icon: Package, variant: 'default' },
  EQUIPMENT: { label: 'Equipo', icon: Wrench, variant: 'secondary' },
  TOOL: { label: 'Herramienta', icon: Hammer, variant: 'outline' },
  KIT: { label: 'Kit', icon: Boxes, variant: 'secondary' },
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
