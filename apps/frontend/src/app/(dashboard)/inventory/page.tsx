'use client';

import { useCallback, useMemo, useState } from 'react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import type { ItemCounts, ItemStats, ItemType } from '@ingexpert/schema';
import { trpc } from '@/lib/trpc';
import { InventoryStats } from '@/features/inventory/components/inventory-stats';
import { InventoryTable } from '@/features/inventory/components/inventory-table';

const DEFAULT_STATS: ItemStats = {
  total: 0,
  products: 0,
  equipment: 0,
  tools: 0,
  kits: 0,
  lowStock: 0,
};

const DEFAULT_COUNTS: ItemCounts = {
  ALL: 0,
  PRODUCT: 0,
  EQUIPMENT: 0,
  TOOL: 0,
  KIT: 0,
};

export default function InventoryPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'ALL'>('ALL');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Global unfiltered stats for the summary cards
  const { data: statsData } = trpc.items.getStats.useQuery();

  // All distinct locations for the filter dropdown
  const { data: allLocations } = trpc.items.getLocations.useQuery();

  // Per-type counts filtered by search + location (for tab badges)
  const { data: countsData } = trpc.items.getCounts.useQuery({
    search: search || undefined,
    location: locationFilter !== 'all' ? locationFilter : undefined,
  });

  // Paginated table data — tRPC infers ItemEntity[] from service return type
  const { data: listResult, isLoading } = trpc.items.list.useQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    orderBy: sorting[0]?.id,
    orderDir: sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined,
    filters: {
      type: typeFilter !== 'ALL' ? typeFilter : undefined,
      location: locationFilter !== 'all' ? locationFilter : undefined,
    },
  });

  // stock is already a plain number — the service calls .toNumber() before serializing
  const items = useMemo(
    () =>
      (listResult?.data ?? []).map((item) => ({
        ...item,
        stock: Number(item.stock), // guard: Decimal serializes as string over JSON
      })),
    [listResult?.data],
  );

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

  const handleTypeFilterChange = useCallback((value: ItemType | 'ALL') => {
    setTypeFilter(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleLocationFilterChange = useCallback((value: string) => {
    setLocationFilter(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventario</h2>
        <p className="text-muted-foreground">
          Gestiona y realiza seguimiento de todos tus ítems, equipos, herramientas y kits.
        </p>
      </div>

      <InventoryStats stats={statsData ?? DEFAULT_STATS} />
      <InventoryTable
        items={items}
        isLoading={isLoading}
        pageCount={listResult?.meta.totalPages ?? 1}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        search={search}
        onSearchChange={handleSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        locationFilter={locationFilter}
        onLocationFilterChange={handleLocationFilterChange}
        typeCounts={countsData ?? DEFAULT_COUNTS}
        allLocations={allLocations ?? []}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
    </div>
  );
}
