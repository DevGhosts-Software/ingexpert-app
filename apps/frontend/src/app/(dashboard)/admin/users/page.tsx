'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@powersync/react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { useLocalUsers } from '@/lib/api-migration-local-reads';
import { useDebounce } from '@/hooks/use-debounce';
import { UserStats } from '@/features/users/components/user-stats';
import { UserTable } from '@/features/users/components/user-table';
import type {
  ActiveTab,
  RoleCounts,
  UserEntity,
} from '@/features/users/components/user-table.types';
import type { UserStats as UserStatsType } from '@ingexpert/schema';

const DEFAULT_STATS: UserStatsType = { total: 0, admins: 0, active: 0, inactive: 0 };
type LocalWorkAreaRow = { name: string };
type LocalUserStatsRow = {
  total: number | string | null;
  admins: number | string | null;
  active: number | string | null;
  inactive: number | string | null;
};

export default function UsersPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [workAreaFilter, setWorkAreaFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);

  const allUsers = useLocalUsers();
  const localWorkAreasQuery = useQuery<LocalWorkAreaRow>(
    'SELECT name FROM work_areas ORDER BY name ASC',
  );
  const localStatsQuery = useQuery<LocalUserStatsRow>(`
    SELECT
      (SELECT COUNT(*) FROM users) AS total, 
      (SELECT COUNT(*) FROM users WHERE role = 'ADMIN') AS admins,
      (SELECT COUNT(*) FROM staff WHERE work_area_id IS NOT NULL) AS active,
      ((SELECT COUNT(*) FROM users) - (SELECT COUNT(*) FROM staff WHERE work_area_id IS NOT NULL)) AS inactive 
  `);
  const localWorkAreas = useMemo(
    () => (localWorkAreasQuery.data ?? []).map((row) => row.name),
    [localWorkAreasQuery.data],
  );
  const localStats = useMemo<UserStatsType>(() => {
    const first = localStatsQuery.data?.[0];
    if (!first) {
      return DEFAULT_STATS;
    }
    return {
      total: Number(first.total ?? 0),
      admins: Number(first.admins ?? 0),
      active: Number(first.active ?? 0),
      inactive: Number(first.inactive ?? 0),
    };
  }, [localStatsQuery.data]);

  const workAreas = localWorkAreas;
  const stats = localStats;

  // Client-side filtering + pagination over the already-fetched list
  const { tableData, pageCount, roleCounts } = useMemo(() => {
    const roleMap: Record<ActiveTab, 'ADMIN' | 'USER' | undefined> = {
      all: undefined,
      admin: 'ADMIN',
      user: 'USER',
    };

    const preRole = allUsers.filter((u) => {
      const matchesSearch =
        debouncedSearch === '' ||
        u.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (u.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ?? false) ||
        (u.workArea?.toLowerCase().includes(debouncedSearch.toLowerCase()) ?? false);
      const matchesArea = workAreaFilter === 'all' || u.workArea === workAreaFilter;
      return matchesSearch && matchesArea;
    });

    const roleFilter = roleMap[activeTab];
    const filtered = roleFilter ? preRole.filter((u) => u.role === roleFilter) : preRole;

    const sorted = [...filtered].sort((a, b) => {
      const col = sorting[0];
      if (!col) return 0;
      const av = String(a[col.id as keyof UserEntity] ?? '');
      const bv = String(b[col.id as keyof UserEntity] ?? '');
      const cmp = av.localeCompare(bv);
      return col.desc ? -cmp : cmp;
    });

    const { pageIndex, pageSize } = pagination;

    return {
      tableData: sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
      pageCount: Math.ceil(sorted.length / pageSize),
      roleCounts: {
        all: preRole.length,
        admin: preRole.filter((u) => u.role === 'ADMIN').length,
        user: preRole.filter((u) => u.role === 'USER').length,
      } satisfies RoleCounts,
    };
  }, [allUsers, debouncedSearch, workAreaFilter, activeTab, sorting, pagination]);

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

  const handleActiveTabChange = useCallback((value: ActiveTab) => {
    setActiveTab(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleWorkAreaFilterChange = useCallback((value: string) => {
    setWorkAreaFilter(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">
          Administra las cuentas del sistema. Solo los administradores pueden crear y modificar
          usuarios.
        </p>
      </div>

      <UserStats stats={stats} />
      <UserTable
        users={tableData}
        isLoading={false}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        search={search}
        onSearchChange={handleSearchChange}
        activeTab={activeTab}
        onActiveTabChange={handleActiveTabChange}
        workAreaFilter={workAreaFilter}
        onWorkAreaFilterChange={handleWorkAreaFilterChange}
        workAreas={workAreas}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        roleCounts={roleCounts}
      />
    </div>
  );
}
