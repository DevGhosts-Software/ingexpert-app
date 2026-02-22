import type { ProjectEntity } from '@ingexpert/schema';

export type ProjectRow = ProjectEntity;

export interface ProjectTableProps {
  projects: ProjectRow[];
  isLoading: boolean;
  pageCount: number;
  pagination: { pageIndex: number; pageSize: number };
  onPaginationChange: (updater: any) => void;
  search: string;
  onSearchChange: (v: string) => void;
  sorting: { id: string; desc: boolean }[];
  onSortingChange: (updater: any) => void;
}
