import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import type { UserEntity, UserRole } from '@ingexpert/schema';

export type { UserEntity } from '@ingexpert/schema';
export type { UserRole } from '@ingexpert/schema';

export type ActiveTab = 'all' | 'admin' | 'user';

export const TAB_ITEMS: Array<{ value: ActiveTab; label: string; role: UserRole | undefined }> = [
  { value: 'all', label: 'Todos', role: undefined },
  { value: 'admin', label: 'Administradores', role: 'ADMIN' },
  { value: 'user', label: 'Usuarios', role: 'USER' },
];

export interface RoleCounts {
  all: number;
  admin: number;
  user: number;
}

export interface UserTableProps {
  users: UserEntity[];
  isLoading?: boolean;
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  search: string;
  onSearchChange: (value: string) => void;
  activeTab: ActiveTab;
  onActiveTabChange: (value: ActiveTab) => void;
  workAreaFilter: string;
  onWorkAreaFilterChange: (value: string) => void;
  workAreas: string[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  roleCounts: RoleCounts;
}
