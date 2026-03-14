'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@powersync/react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import type { ProjectEntity } from '@ingexpert/schema';
import { useMigrationProcedureMode } from '@/lib/api-migration-flags';
import { emitMigrationSourceSelection } from '@/lib/api-migration-telemetry';
import { useDebounce } from '@/hooks/use-debounce';
import { ProjectTable } from '@/features/projects/components/project-table';

type ProjectLocalRow = {
  id: string;
  name: string;
  contact: string;
  address: string;
  manager_id: string;
  manager: string | null;
};

export default function ProjectsPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const projectsStatsMode = useMigrationProcedureMode('projects.getStats');

  const projectsQuery = useQuery<ProjectLocalRow>(`
    SELECT
      p.id,
      p.name,
      p.contact,
      p.address,
      p.manager_id,
      COALESCE(u.name, u.email, '—') AS manager 
    FROM projects p
    LEFT JOIN users u ON u.id = p.manager_id
  `);

  useEffect(() => {
    emitMigrationSourceSelection({
      procedure: 'projects.getStats',
      mode: projectsStatsMode,
      source: 'local',
    });
  }, [projectsStatsMode]);

  const allProjects = useMemo<ProjectEntity[]>(
    () =>
      (projectsQuery.data ?? []).map((project) => ({
        id: project.id,
        name: project.name,
        contact: project.contact,
        address: project.address,
        managerId: project.manager_id,
        manager: project.manager,
      })),
    [projectsQuery.data],
  );

  const filteredProjects = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return allProjects.filter((project) => {
      if (!needle) {
        return true;
      }
      return (
        project.name.toLowerCase().includes(needle) ||
        project.contact.toLowerCase().includes(needle) ||
        project.address.toLowerCase().includes(needle) ||
        (project.manager ?? '').toLowerCase().includes(needle)
      );
    });
  }, [allProjects, debouncedSearch]);

  const sortedProjects = useMemo(() => {
    const activeSort = sorting[0];
    if (!activeSort) {
      return filteredProjects;
    }

    const copy = [...filteredProjects];
    copy.sort((left, right) => {
      const leftValue = String(left[activeSort.id as keyof ProjectEntity] ?? '');
      const rightValue = String(right[activeSort.id as keyof ProjectEntity] ?? '');
      const compareValue = leftValue.localeCompare(rightValue);
      return activeSort.desc ? -compareValue : compareValue;
    });
    return copy;
  }, [filteredProjects, sorting]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(sortedProjects.length / pagination.pageSize)),
    [pagination.pageSize, sortedProjects.length],
  );

  const pagedProjects = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return sortedProjects.slice(start, start + pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize, sortedProjects]);

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
        projects={pagedProjects}
        isLoading={projectsQuery.isFetching}
        pageCount={pageCount}
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
