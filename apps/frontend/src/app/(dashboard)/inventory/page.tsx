'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@powersync/react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import type { ItemCounts, ItemEntity, ItemStats, ItemType } from '@ingexpert/schema';
import { useMigrationProcedureMode } from '@/lib/api-migration-flags';
import { emitMigrationSourceSelection } from '@/lib/api-migration-telemetry';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { InventoryStats } from '@/features/inventory/components/inventory-stats';
import { InventoryTable } from '@/features/inventory/components/inventory-table';
import { ItemDetailsSheet } from '@/features/inventory/components/item-details-sheet';

const DEFAULT_STATS: ItemStats = {
  total: 0,
  products: 0,
  equipment: 0,
  tools: 0,
  kits: 0,
};

const DEFAULT_COUNTS: ItemCounts = {
  ALL: 0,
  PRODUCT: 0,
  EQUIPMENT: 0,
  TOOL: 0,
  KIT: 0,
};

type InventoryRow = {
  id: string;
  code: string;
  name: string;
  location: string;
  stock: number | string | null;
  unit: string;
  type: string;
  image_url: string | null;
};

type KitExportRow = {
  kitName: string;
  kitCode: string;
  componentName: string;
  componentCode: string;
  quantity: number | string | null;
  unit: string;
};

const ITEM_TYPES: ItemType[] = ['PRODUCT', 'EQUIPMENT', 'TOOL', 'KIT'];

function asItemType(value: string): ItemType {
  return ITEM_TYPES.includes(value as ItemType) ? (value as ItemType) : 'PRODUCT';
}

export default function InventoryPage() {
  const isAdmin = useIsAdmin();
  const itemStatsMode = useMigrationProcedureMode('items.getStats');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [typeFilter, setTypeFilter] = useState<ItemType | 'ALL'>('ALL');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [selectedItem, setSelectedItem] = useState<ItemEntity | null>(null);

  const inventoryQuery = useQuery<InventoryRow>(`
    SELECT
      id,
      code,
      name,
      location,
      stock,
      unit,
      type,
      image_url
    FROM items
  `);

  const kitsExportQuery = useQuery<KitExportRow>(`
    SELECT
      kit.name AS "kitName",
      kit.code AS "kitCode",
      component.name AS "componentName",
      component.code AS "componentCode",
      kd.quantity,
      component.unit AS "unit"
    FROM kit_details kd
    INNER JOIN items kit ON kit.id = kd.kit_id
    INNER JOIN items component ON component.id = kd.item_id
    ORDER BY kit.name, component.name
  `);

  useEffect(() => {
    emitMigrationSourceSelection({
      procedure: 'items.getStats',
      mode: itemStatsMode,
      source: 'local',
    });
  }, [itemStatsMode]);

  const allItems = useMemo(
    () =>
      (inventoryQuery.data ?? []).map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        location: item.location,
        stock: Number(item.stock ?? 0),
        unit: item.unit,
        type: asItemType(item.type),
        imageUrl: item.image_url ?? '',
      })),
    [inventoryQuery.data],
  );

  const statsData = useMemo<ItemStats>(() => {
    return {
      total: allItems.length,
      products: allItems.filter((item) => item.type === 'PRODUCT').length,
      equipment: allItems.filter((item) => item.type === 'EQUIPMENT').length,
      tools: allItems.filter((item) => item.type === 'TOOL').length,
      kits: allItems.filter((item) => item.type === 'KIT').length,
    };
  }, [allItems]);

  const allLocations = useMemo(
    () =>
      Array.from(
        new Set(allItems.map((item) => item.location).filter((value) => value !== '')),
      ).sort(),
    [allItems],
  );

  const baseFilteredItems = useMemo(() => {
    const searchValue = debouncedSearch.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesSearch =
        searchValue === '' ||
        item.name.toLowerCase().includes(searchValue) ||
        item.code.toLowerCase().includes(searchValue) ||
        item.location.toLowerCase().includes(searchValue);
      const matchesLocation = locationFilter === 'all' || item.location === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [allItems, debouncedSearch, locationFilter]);

  const countsData = useMemo<ItemCounts>(() => {
    return {
      ALL: baseFilteredItems.length,
      PRODUCT: baseFilteredItems.filter((item) => item.type === 'PRODUCT').length,
      EQUIPMENT: baseFilteredItems.filter((item) => item.type === 'EQUIPMENT').length,
      TOOL: baseFilteredItems.filter((item) => item.type === 'TOOL').length,
      KIT: baseFilteredItems.filter((item) => item.type === 'KIT').length,
    };
  }, [baseFilteredItems]);

  const tableItems = useMemo(() => {
    const byType =
      typeFilter === 'ALL'
        ? baseFilteredItems
        : baseFilteredItems.filter((item) => item.type === typeFilter);

    const sorted = [...byType].sort((left, right) => {
      const activeSort = sorting[0];
      if (!activeSort) {
        return 0;
      }

      const leftValue = left[activeSort.id as keyof ItemEntity];
      const rightValue = right[activeSort.id as keyof ItemEntity];

      let compareValue = 0;
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        compareValue = leftValue - rightValue;
      } else {
        compareValue = String(leftValue ?? '').localeCompare(String(rightValue ?? ''));
      }

      return activeSort.desc ? -compareValue : compareValue;
    });

    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sorted.slice(start, end);
  }, [baseFilteredItems, pagination.pageIndex, pagination.pageSize, sorting, typeFilter]);

  const pageCount = useMemo(() => {
    const totalForType =
      typeFilter === 'ALL'
        ? baseFilteredItems.length
        : baseFilteredItems.filter((item) => item.type === typeFilter).length;
    return Math.max(1, Math.ceil(totalForType / pagination.pageSize));
  }, [baseFilteredItems, pagination.pageSize, typeFilter]);

  const kitExportRows = useMemo(
    () =>
      (kitsExportQuery.data ?? []).map((row) => ({
        kitName: row.kitName,
        kitCode: row.kitCode,
        componentName: row.componentName,
        componentCode: row.componentCode,
        quantity: Number(row.quantity ?? 0),
        unit: row.unit,
      })),
    [kitsExportQuery.data],
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

  const handleRowClick = useCallback((item: ItemEntity) => {
    setSelectedItem(item);
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
        items={tableItems}
        isLoading={inventoryQuery.isFetching && allItems.length === 0}
        isAdmin={isAdmin}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        search={search}
        onSearchChange={handleSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        locationFilter={locationFilter}
        onLocationFilterChange={handleLocationFilterChange}
        typeCounts={countsData ?? DEFAULT_COUNTS}
        allLocations={allLocations}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        onRowClick={handleRowClick}
        exportItems={allItems}
        exportKitRows={kitExportRows}
      />
      <ItemDetailsSheet
        item={selectedItem}
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
