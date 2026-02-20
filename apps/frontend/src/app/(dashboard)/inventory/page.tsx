'use client';

import { useCallback, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { trpc } from '@/lib/trpc';
import {
  InventoryStats,
  type InventoryStats as InventoryStatsType,
} from '@/features/inventory/components/inventory-stats';
import {
  InventoryTable,
  type ItemType,
} from '@/features/inventory/components/inventory-table';

interface RawApiItem {
  id: string;
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

  const queryFilters = {
    location: locationFilter !== 'all' ? locationFilter : undefined,
  };

  const { data: listResult, isLoading } = trpc.items.list.useQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    filters: {
      ...queryFilters,
      type: typeFilter !== 'ALL' ? typeFilter : undefined,
    },
  });

  // Parallel count queries for stats cards and tab badges
  const countBase = { page: 1, limit: 1, search: search || undefined, filters: queryFilters };
  const { data: allCount } = trpc.items.list.useQuery(countBase);
  const { data: productCount } = trpc.items.list.useQuery({ ...countBase, filters: { ...queryFilters, type: 'PRODUCT' } });
  const { data: equipmentCount } = trpc.items.list.useQuery({ ...countBase, filters: { ...queryFilters, type: 'EQUIPMENT' } });
  const { data: toolCount } = trpc.items.list.useQuery({ ...countBase, filters: { ...queryFilters, type: 'TOOL' } });
  const { data: kitCount } = trpc.items.list.useQuery({ ...countBase, filters: { ...queryFilters, type: 'KIT' } });

  const typeCounts = {
    ALL: allCount?.meta.total ?? 0,
    PRODUCT: productCount?.meta.total ?? 0,
    EQUIPMENT: equipmentCount?.meta.total ?? 0,
    TOOL: toolCount?.meta.total ?? 0,
    KIT: kitCount?.meta.total ?? 0,
  };

  const stats: InventoryStatsType = {
    total: typeCounts.ALL,
    products: typeCounts.PRODUCT,
    equipment: typeCounts.EQUIPMENT,
    tools: typeCounts.TOOL,
    kits: typeCounts.KIT,
    lowStock: 0,
  };

  const items = ((listResult?.data ?? []) as RawApiItem[]).map((item) => ({
    id: item.id,
    name: item.name,
    location: item.location,
    stock: Number(item.stock),
    unit: item.unit,
    type: item.type as ItemType,
    imageUrl: item.imageUrl ?? '',
  }));

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
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
        onPaginationChange={setPagination}
        search={search}
        onSearchChange={handleSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        locationFilter={locationFilter}
        onLocationFilterChange={handleLocationFilterChange}
        typeCounts={typeCounts}
      />
    </div>
  );
}
