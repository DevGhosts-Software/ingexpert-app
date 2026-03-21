'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@powersync/react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import type { MovementStats as MovementStatsType } from '@ingexpert/schema';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { MovementStats } from '@/features/movements/components/movement-stats';
import { MovementTable } from '@/features/movements/components/movement-table';
import type {
  ActiveTab,
  MovementExportDetailRow,
  TypeCounts,
} from '@/features/movements/components/movement-table.types';

const DEFAULT_COUNTS: TypeCounts = {
  all: 0,
  purchase: 0,
  return: 0,
  exit: 0,
  writeoff: 0,
  stockAdjustmentIn: 0,
  stockAdjustmentOut: 0,
};

type LocalMovementRow = {
  id: string;
  type:
    | 'PURCHASE'
    | 'RETURN'
    | 'EXIT'
    | 'WRITEOFF'
    | 'STOCK_ADJUSTMENT_IN'
    | 'STOCK_ADJUSTMENT_OUT';
  created_by_id: string;
  destination: string | null;
  observations: string | null;
  responsible_delivery_id: string | null;
  responsible_receipt_id: string | null;
  date: string;
  project_id: string | null;
  items_count: number | string | null;
  project_name: string | null;
  creator_name: string | null;
  responsible_delivery_name: string | null;
  responsible_receipt_name: string | null;
};

type LocalProjectOption = { id: string; name: string };
type LocalUserOption = { id: string; name: string | null; email: string };
type LocalMovementExportDetailRow = {
  movement_id: string;
  movement_date: string;
  movement_type: string;
  movement_observations: string | null;
  item_code: string;
  item_name: string;
  quantity: number | string | null;
  unit: string;
};

export default function MovementsPage() {
  const isAdmin = useIsAdmin();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [typeFilter, setTypeFilter] = useState<ActiveTab>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);

  // Shared filters (applied client-side on local rows)
  const [creatorFilter, setCreatorFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) {
        setCurrentUserId(session?.user.id ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const movementsQuery = useQuery<LocalMovementRow>(`
    SELECT
      m.id,
      CASE
        WHEN LOWER(TRIM(m.type)) IN ('purchase', 'compra') THEN 'PURCHASE'
        WHEN LOWER(TRIM(m.type)) IN ('return', 'devolucion') THEN 'RETURN'
        WHEN LOWER(TRIM(m.type)) IN ('exit', 'salida') THEN 'EXIT'
        WHEN LOWER(TRIM(m.type)) IN ('writeoff', 'baja') THEN 'WRITEOFF'
        WHEN LOWER(TRIM(m.type)) IN ('stock_adjustment_in') THEN 'STOCK_ADJUSTMENT_IN'
        WHEN LOWER(TRIM(m.type)) IN ('stock_adjustment_out') THEN 'STOCK_ADJUSTMENT_OUT'
      END AS type,
      m.created_by_id,
      m.destination,
      m.observations,
      m.responsible_delivery_id,
      m.responsible_receipt_id,
      m.date,
      m.project_id,
      COUNT(md.id) AS items_count,
      p.name AS project_name,
      creator.name AS creator_name,
      delivery.name AS responsible_delivery_name,
      receipt.name AS responsible_receipt_name
    FROM movements m
    LEFT JOIN movement_details md ON md.movement_id = m.id
    LEFT JOIN projects p ON p.id = m.project_id
    LEFT JOIN users creator ON creator.id = m.created_by_id
    LEFT JOIN users delivery ON delivery.id = m.responsible_delivery_id
    LEFT JOIN users receipt ON receipt.id = m.responsible_receipt_id
    WHERE LOWER(TRIM(m.type)) IN (
      'purchase',
      'compra',
      'return',
      'devolucion',
      'exit',
      'salida',
      'writeoff',
      'baja',
      'stock_adjustment_in',
      'stock_adjustment_out'
    )
     GROUP BY
      m.id, m.type, m.created_by_id, m.destination, m.observations,
      m.responsible_delivery_id, m.responsible_receipt_id, m.date, m.project_id,
      p.name, creator.name, delivery.name, receipt.name
    ORDER BY m.date DESC
  `);
  const projectsQuery = useQuery<LocalProjectOption>(
    'SELECT id, name FROM projects ORDER BY name ASC',
  );
  const usersQuery = useQuery<LocalUserOption>(
    isAdmin
      ? 'SELECT id, name, email FROM users ORDER BY COALESCE(name, email) ASC'
      : 'SELECT id, name, email FROM users WHERE 1 = 0',
  );
  const movementDetailsQuery = useQuery<LocalMovementExportDetailRow>(`
    SELECT
      m.id AS movement_id,
      m.date AS movement_date,
      m.type AS movement_type,
      m.observations AS movement_observations,
      i.code AS item_code,
      i.name AS item_name,
      md.quantity,
      i.unit AS unit
    FROM movements m
    INNER JOIN movement_details md ON md.movement_id = m.id
    INNER JOIN items i ON i.id = md.item_id
    WHERE LOWER(TRIM(m.type)) IN (
      'purchase',
      'compra',
      'return',
      'devolucion',
      'exit',
      'salida',
      'writeoff',
      'baja',
      'stock_adjustment_in',
      'stock_adjustment_out'
    )
    ORDER BY m.date DESC, i.name ASC
  `);

  const allMovements = useMemo(
    () =>
      (movementsQuery.data ?? []).map((movement) => ({
        id: movement.id,
        type: movement.type,
        createdById: movement.created_by_id,
        destination: movement.destination,
        observations: movement.observations,
        responsibleDeliveryId: movement.responsible_delivery_id,
        responsibleReceiptId: movement.responsible_receipt_id,
        date: movement.date,
        projectId: movement.project_id,
        itemsCount: Number(movement.items_count ?? 0),
        projectName: movement.project_name,
        creatorName: movement.creator_name,
        responsibleDeliveryName: movement.responsible_delivery_name,
        responsibleReceiptName: movement.responsible_receipt_name,
      })),
    [movementsQuery.data],
  );

  const projects = projectsQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const { tableData, exportMovements, pageCount, typeCounts, stats } = useMemo(() => {
    const typeMap: Record<
      ActiveTab,
      | 'PURCHASE'
      | 'RETURN'
      | 'EXIT'
      | 'WRITEOFF'
      | 'STOCK_ADJUSTMENT_IN'
      | 'STOCK_ADJUSTMENT_OUT'
      | undefined
    > = {
      all: undefined,
      purchase: 'PURCHASE',
      return: 'RETURN',
      exit: 'EXIT',
      writeoff: 'WRITEOFF',
      stockAdjustmentIn: 'STOCK_ADJUSTMENT_IN',
      stockAdjustmentOut: 'STOCK_ADJUSTMENT_OUT',
    };

    const preCreatedByFiltered = allMovements.filter((movement) => {
      if (isAdmin) {
        return creatorFilter === 'all' || movement.createdById === creatorFilter;
      }
      if (!currentUserId) {
        return true;
      }
      return movement.createdById === currentUserId;
    });

    const preDateFiltered = preCreatedByFiltered.filter((movement) => {
      if (!dateFrom && !dateTo) {
        return true;
      }
      const movementDate = new Date(movement.date);
      if (dateFrom && movementDate < new Date(`${dateFrom}T00:00:00`)) {
        return false;
      }
      if (dateTo && movementDate > new Date(`${dateTo}T23:59:59`)) {
        return false;
      }
      return true;
    });

    const preType = preDateFiltered.filter((m) => {
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
    const now = new Date();
    const thisMonthCount = preDateFiltered.filter((movement) => {
      const movementDate = new Date(movement.date);
      return (
        movementDate.getFullYear() === now.getFullYear() &&
        movementDate.getMonth() === now.getMonth()
      );
    }).length;

    return {
      exportMovements: filtered,
      tableData: sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
      pageCount: Math.max(1, Math.ceil(sorted.length / pageSize)),
      typeCounts: {
        all: preType.length,
        purchase: preType.filter((m) => m.type === 'PURCHASE').length,
        return: preType.filter((m) => m.type === 'RETURN').length,
        exit: preType.filter((m) => m.type === 'EXIT').length,
        writeoff: preType.filter((m) => m.type === 'WRITEOFF').length,
        stockAdjustmentIn: preType.filter((m) => m.type === 'STOCK_ADJUSTMENT_IN').length,
        stockAdjustmentOut: preType.filter((m) => m.type === 'STOCK_ADJUSTMENT_OUT').length,
      } satisfies TypeCounts,
      stats: {
        total: preDateFiltered.length,
        purchases: preDateFiltered.filter((m) => m.type === 'PURCHASE').length,
        returns: preDateFiltered.filter((m) => m.type === 'RETURN').length,
        exits: preDateFiltered.filter((m) => m.type === 'EXIT').length,
        writeoffs: preDateFiltered.filter((m) => m.type === 'WRITEOFF').length,
        thisMonth: thisMonthCount,
      } satisfies MovementStatsType,
    };
  }, [
    allMovements,
    creatorFilter,
    currentUserId,
    dateFrom,
    dateTo,
    debouncedSearch,
    isAdmin,
    pagination,
    projectFilter,
    sorting,
    typeFilter,
  ]);

  const exportDetails = useMemo<MovementExportDetailRow[]>(() => {
    const exportMovementIds = new Set(exportMovements.map((movement) => movement.id));
    const allowedMovementIds = new Set(
      (isAdmin
        ? exportMovements
        : exportMovements.filter(
            (movement) => !currentUserId || movement.createdById === currentUserId,
          )
      ).map((movement) => movement.id),
    );

    return (movementDetailsQuery.data ?? [])
      .filter(
        (detail) =>
          exportMovementIds.has(detail.movement_id) && allowedMovementIds.has(detail.movement_id),
      )
      .map((detail) => ({
        movementId: detail.movement_id,
        movementDate: detail.movement_date,
        movementType: detail.movement_type,
        movementObservations: detail.movement_observations,
        itemCode: detail.item_code,
        itemName: detail.item_name,
        quantity: Number(detail.quantity ?? 0),
        unit: detail.unit,
      }));
  }, [currentUserId, exportMovements, isAdmin, movementDetailsQuery.data]);

  const resetPage = useCallback(() => setPagination((p) => ({ ...p, pageIndex: 0 })), []);

  const handlePaginationChange: OnChangeFn<PaginationState> = useCallback((updater) => {
    setPagination((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      resetPage();
    },
    [resetPage],
  );

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      setSorting((prev) => (typeof updater === 'function' ? updater(prev) : updater));
      resetPage();
    },
    [resetPage],
  );

  const handleTypeFilterChange = useCallback(
    (value: ActiveTab) => {
      setTypeFilter(value);
      resetPage();
    },
    [resetPage],
  );

  const handleProjectFilterChange = useCallback(
    (value: string) => {
      setProjectFilter(value);
      resetPage();
    },
    [resetPage],
  );

  const handleCreatorFilterChange = useCallback(
    (value: string) => {
      setCreatorFilter(value);
      resetPage();
    },
    [resetPage],
  );

  const handleDateFromChange = useCallback(
    (value: string) => {
      setDateFrom(value);
      resetPage();
    },
    [resetPage],
  );

  const handleDateToChange = useCallback(
    (value: string) => {
      setDateTo(value);
      resetPage();
    },
    [resetPage],
  );

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
        exportMovements={exportMovements}
        exportDetails={exportDetails}
        totalMovementsCount={allMovements.length}
        isLoading={movementsQuery.isFetching && allMovements.length === 0}
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
        // Admin-only filters
        isAdmin={isAdmin}
        users={users}
        creatorFilter={creatorFilter}
        onCreatorFilterChange={handleCreatorFilterChange}
        dateFrom={dateFrom}
        onDateFromChange={handleDateFromChange}
        dateTo={dateTo}
        onDateToChange={handleDateToChange}
      />
    </div>
  );
}
