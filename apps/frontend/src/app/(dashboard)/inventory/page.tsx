'use client';

import { useCallback, useState } from 'react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import { trpc } from '@/lib/trpc';
import {
  InventoryStats,
  type InventoryStats as InventoryStatsType,
} from '@/features/inventory/components/inventory-stats';
import { InventoryTable, type ItemType } from '@/features/inventory/components/inventory-table';

interface RawApiItem {
  id: string;
  code: string;
  name: string;
  location: string;
  stock: unknown;
  unit: string;
  type: string;
  imageUrl: string;
}

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

  // Paginated table data
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

  const stats: InventoryStatsType = {
    total: statsData?.total ?? 0,
    products: statsData?.products ?? 0,
    equipment: statsData?.equipment ?? 0,
    tools: statsData?.tools ?? 0,
    kits: statsData?.kits ?? 0,
    lowStock: statsData?.lowStock ?? 0,
  };

  const typeCounts = {
    ALL: countsData?.ALL ?? 0,
    PRODUCT: countsData?.PRODUCT ?? 0,
    EQUIPMENT: countsData?.EQUIPMENT ?? 0,
    TOOL: countsData?.TOOL ?? 0,
    KIT: countsData?.KIT ?? 0,
  };

  const items = ((listResult?.data ?? []) as RawApiItem[]).map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    location: item.location,
    stock: Number(item.stock),
    unit: item.unit,
    type: item.type as ItemType,
    imageUrl: item.imageUrl ?? '',
  }));

  // Explicit handler so TanStack Table's updater functions are handled correctly
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

      <InventoryStats stats={stats} />
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
        typeCounts={typeCounts}
        allLocations={allLocations ?? []}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
    </div>
  );
}
