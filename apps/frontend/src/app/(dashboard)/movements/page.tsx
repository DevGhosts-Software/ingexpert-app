'use client';

import { useCallback, useMemo, useState } from 'react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import type { MovementStats as MovementStatsType } from '@ingexpert/schema';
import { trpc } from '@/lib/trpc';
import { useDebounce } from '@/hooks/use-debounce';
import { MovementStats } from '@/features/movements/components/movement-stats';
import { MovementTable } from '@/features/movements/components/movement-table';
import type { ActiveTab, TypeCounts } from '@/features/movements/components/movement-table.types';

const DEFAULT_STATS: MovementStatsType = { total: 0, entries: 0, exits: 0, thisMonth: 0 };
const DEFAULT_COUNTS: TypeCounts = { all: 0, entry: 0, exit: 0 };

export default function MovementsPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [typeFilter, setTypeFilter] = useState<ActiveTab>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);

  const { data: allMovements = [], isLoading } = trpc.movements.getAll.useQuery();
  const { data: stats = DEFAULT_STATS } = trpc.movements.getStats.useQuery();
  const { data: projects = [] } = trpc.movements.getProjects.useQuery();

  const { tableData, pageCount, typeCounts } = useMemo(() => {
    const typeMap: Record<ActiveTab, 'ENTRY' | 'EXIT' | undefined> = {
      all: undefined,
      entry: 'ENTRY',
      exit: 'EXIT',
    };

    const preType = allMovements.filter((m) => {
      const matchesSearch =
        debouncedSearch === '' ||
        (m.creatorName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ?? false) ||
        (m.destination?.toLowerCase().includes(debouncedSearch.toLowerCase()) ?? false) ||
        (m.projectName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ?? false);
      const matchesProject = projectFilter === 'all' || m.projectId === projectFilter;
      return matchesSearch && matchesProject;
    });

    const typeFilterValue = typeMap[typeFilter];
    const filtered = typeFilterValue ? preType.filter((m) => m.type === typeFilterValue) : preType;

    const sorted = [...filtered].sort((a, b) => {
      const col = sorting[0];
      if (!col) return 0;
      if (col.id === 'date') {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return col.desc ? -diff : diff;
      }
      const av = String(a[col.id as keyof typeof a] ?? '');
      const bv = String(b[col.id as keyof typeof b] ?? '');
      const cmp = av.localeCompare(bv);
      return col.desc ? -cmp : cmp;
    });

    const { pageIndex, pageSize } = pagination;

    return {
      tableData: sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
      pageCount: Math.ceil(sorted.length / pageSize),
      typeCounts: {
        all: preType.length,
        entry: preType.filter((m) => m.type === 'ENTRY').length,
        exit: preType.filter((m) => m.type === 'EXIT').length,
      } satisfies TypeCounts,
    };
  }, [allMovements, debouncedSearch, projectFilter, typeFilter, sorting, pagination]);

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

  const handleTypeFilterChange = useCallback((value: ActiveTab) => {
    setTypeFilter(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleProjectFilterChange = useCallback((value: string) => {
    setProjectFilter(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Movimientos</h2>
        <p className="text-muted-foreground">
          Historial de entradas y salidas de material del inventario.
        </p>
      </div>

      <MovementStats stats={stats} />
      <MovementTable
        movements={tableData}
        isLoading={isLoading}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        search={search}
        onSearchChange={handleSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        projectFilter={projectFilter}
        onProjectFilterChange={handleProjectFilterChange}
        projects={projects}
        typeCounts={typeCounts ?? DEFAULT_COUNTS}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
    </div>
  );
}
