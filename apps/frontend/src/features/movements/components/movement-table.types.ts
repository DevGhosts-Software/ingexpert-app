import type { MovementHeaderEntity } from '@ingexpert/schema';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';

export type { MovementHeaderEntity as MovementRow } from '@ingexpert/schema';
type MovementRow = MovementHeaderEntity;

export type ActiveTab =
  | 'all'
  | 'purchase'
  | 'return'
  | 'exit'
  | 'writeoff'
  | 'stockAdjustmentIn'
  | 'stockAdjustmentOut';

export type TypeCounts = {
  all: number;
  purchase: number;
  return: number;
  exit: number;
  writeoff: number;
  stockAdjustmentIn: number;
  stockAdjustmentOut: number;
};

export type { MovementHeaderEntity };

export type MovementExportDetailRow = {
  movementId: string;
  movementDate: string;
  movementType: string;
  movementObservations: string | null;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
};

export type MovementSelectionState = {
  checked: boolean;
  indeterminate: boolean;
};

export type MovementTableMeta = {
  selectionState: MovementSelectionState;
  onToggleScope: () => void;
  isRowSelected: (id: string) => boolean;
  onToggleRow: (id: string) => void;
};

type ProjectOption = { id: string; name: string };
type UserOption = { id: string; name: string | null; email: string };

export interface MovementTableProps {
  movements: MovementRow[];
  exportMovements: MovementRow[];
  allMovementIds: string[];
  allMovements: MovementRow[];
  exportDetails: MovementExportDetailRow[];
  totalMovementsCount: number;
  isLoading: boolean;
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: ActiveTab;
  onTypeFilterChange: (v: ActiveTab) => void;
  projectFilter: string;
  onProjectFilterChange: (v: string) => void;
  projects: ProjectOption[];
  typeCounts: TypeCounts;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  isAdmin: boolean;
  users: UserOption[];
  creatorFilter: string;
  onCreatorFilterChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
}
