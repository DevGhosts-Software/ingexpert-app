'use client';

import { useCallback, useState } from 'react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { trpc } from '@/lib/trpc';
import { useDebounce } from '@/hooks/use-debounce';
import { ProjectTable } from '@/features/projects/components/project-table';

export default function ProjectsPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);

  const { data: listResult, isLoading } = trpc.projects.list.useQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch || undefined,
    orderBy: sorting[0]?.id,
    orderDir: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
  });

  const handlePaginationChange: OnChangeFn<PaginationState> = useCallback((updater) => {
    setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleSortingChange: OnChangeFn<SortingState> = useCallback((updater) => {
    setSorting((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Proyectos</h2>
        <p className="text-muted-foreground">
          Gestiona los proyectos de la empresa. Los movimientos de inventario pueden asociarse a un
          proyecto.
        </p>
      </div>

      <ProjectTable
        projects={listResult?.data ?? []}
        isLoading={isLoading}
        pageCount={listResult?.meta.totalPages ?? 1}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        search={search}
        onSearchChange={handleSearchChange}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
    </div>
  );
}
