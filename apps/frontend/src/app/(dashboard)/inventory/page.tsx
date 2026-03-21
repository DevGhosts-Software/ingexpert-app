'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@powersync/react';
import type { OnChangeFn, PaginationState, SortingState } from '@tanstack/react-table';
import type { ItemCounts, ItemStats, ItemType } from '@ingexpert/schema';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { InventoryStats } from '@/features/inventory/components/inventory-stats';
import { InventoryTable } from '@/features/inventory/components/inventory-table';
import { ItemDetailsSheet } from '@/features/inventory/components/item-details-sheet';
import type { InventoryItem } from '@/features/inventory/components/inventory-table.types';

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
  unit: string;
  type: string;
  image_url: string | null;
  warehouse_inventory: number | string | null;
  onsite_inventory: number | string | null;
  total_inventory: number | string | null;
};

type CountRow = {
  total_count: number | string | null;
};

type TypeCountRow = {
  type: string;
  total_count: number | string | null;
};

type StatsRow = {
  total: number | string | null;
  products: number | string | null;
  equipment: number | string | null;
  tools: number | string | null;
  kits: number | string | null;
};

type LocationRow = {
  location: string;
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

function escapeSqlLiteral(value: string): string {
  return value.replaceAll("'", "''");
}

const SORT_COLUMN_SQL: Record<string, string> = {
  name: 'name',
  code: 'code',
  type: 'type',
  location: 'location',
  unit: 'unit',
  warehouseInventory: 'warehouse_inventory',
  onsiteInventory: 'onsite_inventory',
  totalInventory: 'total_inventory',
};

function buildInventoryQuerySql({
  search,
  location,
  type,
  sortBy,
  sortDirection,
  pageSize,
  offset,
}: {
  search: string;
  location: string;
  type: ItemType | 'ALL';
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  pageSize: number;
  offset: number;
}) {
  const escapedSearch = escapeSqlLiteral(search.trim().toLowerCase());
  const searchFilter =
    escapedSearch.length > 0
      ? `
        AND (
          LOWER(i.name) LIKE '%${escapedSearch}%'
          OR LOWER(i.code) LIKE '%${escapedSearch}%'
          OR LOWER(i.location) LIKE '%${escapedSearch}%'
        )
      `
      : '';

  const locationFilter =
    location === 'all' ? '' : `AND i.location = '${escapeSqlLiteral(location)}'`;

  const typeFilter = type === 'ALL' ? '' : `AND i.type = '${type}'`;
  const orderBy = SORT_COLUMN_SQL[sortBy] ?? 'name';

  return `
    WITH filtered_items AS (
      SELECT
        i.id,
        i.code,
        i.name,
        i.location,
        i.unit,
        i.type,
        i.image_url
      FROM items i
      WHERE 1 = 1
      ${searchFilter}
      ${locationFilter}
      ${typeFilter}
    ),
    movement_totals AS (
      SELECT
        md.item_id,
        SUM(
          CASE
            WHEN LOWER(TRIM(m.type)) IN ('compra', 'purchase', 'devolucion', 'return', 'ajuste_positivo', 'stock_adjustment_in')
              THEN ABS(COALESCE(md.quantity, 0))
            WHEN LOWER(TRIM(m.type)) IN ('salida', 'exit', 'baja', 'writeoff', 'ajuste_negativo', 'stock_adjustment_out')
              THEN -ABS(COALESCE(md.quantity, 0))
            ELSE 0
          END
        ) AS warehouse_delta,
        SUM(
          CASE
            WHEN LOWER(TRIM(m.type)) IN ('salida', 'exit')
              THEN ABS(COALESCE(md.quantity, 0))
            WHEN LOWER(TRIM(m.type)) IN ('devolucion', 'return')
              THEN -ABS(COALESCE(md.quantity, 0))
            ELSE 0
          END
        ) AS onsite_delta
      FROM movement_details md
      INNER JOIN movements m ON m.id = md.movement_id
      INNER JOIN filtered_items fi ON fi.id = md.item_id
      GROUP BY md.item_id
    ),
    enriched AS (
      SELECT
        fi.id,
        fi.code,
        fi.name,
        fi.location,
        fi.unit,
        fi.type,
        fi.image_url,
        COALESCE(mt.warehouse_delta, 0) AS warehouse_inventory,
        COALESCE(mt.onsite_delta, 0) AS onsite_inventory,
        COALESCE(mt.warehouse_delta, 0) + COALESCE(mt.onsite_delta, 0) AS total_inventory
      FROM filtered_items fi
      LEFT JOIN movement_totals mt ON mt.item_id = fi.id
    ),
    paged AS (
      SELECT *
      FROM enriched
      ORDER BY ${orderBy} ${sortDirection}, name ASC
      LIMIT ${pageSize}
      OFFSET ${offset}
    )
    SELECT
      id,
      code,
      name,
      location,
      unit,
      type,
      image_url,
      warehouse_inventory,
      onsite_inventory,
      total_inventory
    FROM paged
  `;
}

export default function InventoryPage() {
  const isAdmin = useIsAdmin();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [typeFilter, setTypeFilter] = useState<ItemType | 'ALL'>('ALL');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const sortBy = sorting[0]?.id ?? 'name';
  const sortDirection: 'ASC' | 'DESC' = sorting[0]?.desc ? 'DESC' : 'ASC';
  const offset = pagination.pageIndex * pagination.pageSize;

  const inventorySql = useMemo(
    () =>
      buildInventoryQuerySql({
        search: debouncedSearch,
        location: locationFilter,
        type: typeFilter,
        sortBy,
        sortDirection,
        pageSize: pagination.pageSize,
        offset,
      }),
    [
      debouncedSearch,
      locationFilter,
      typeFilter,
      sortBy,
      sortDirection,
      pagination.pageSize,
      offset,
    ],
  );

  const pagedCountSql = useMemo(() => {
    const escapedSearch = escapeSqlLiteral(debouncedSearch.trim().toLowerCase());
    const searchFilter =
      escapedSearch.length > 0
        ? `
          AND (
            LOWER(i.name) LIKE '%${escapedSearch}%'
            OR LOWER(i.code) LIKE '%${escapedSearch}%'
            OR LOWER(i.location) LIKE '%${escapedSearch}%'
          )
        `
        : '';
    const locationSql =
      locationFilter === 'all' ? '' : `AND i.location = '${escapeSqlLiteral(locationFilter)}'`;
    const typeSql = typeFilter === 'ALL' ? '' : `AND i.type = '${typeFilter}'`;

    return `
      SELECT COUNT(*) AS total_count
      FROM items i
      WHERE 1 = 1
      ${searchFilter}
      ${locationSql}
      ${typeSql}
    `;
  }, [debouncedSearch, locationFilter, typeFilter]);

  const typeCountsSql = useMemo(() => {
    const escapedSearch = escapeSqlLiteral(debouncedSearch.trim().toLowerCase());
    const searchFilter =
      escapedSearch.length > 0
        ? `
          AND (
            LOWER(i.name) LIKE '%${escapedSearch}%'
            OR LOWER(i.code) LIKE '%${escapedSearch}%'
            OR LOWER(i.location) LIKE '%${escapedSearch}%'
          )
        `
        : '';
    const locationSql =
      locationFilter === 'all' ? '' : `AND i.location = '${escapeSqlLiteral(locationFilter)}'`;

    return `
      SELECT i.type, COUNT(*) AS total_count
      FROM items i
      WHERE 1 = 1
      ${searchFilter}
      ${locationSql}
      GROUP BY i.type
    `;
  }, [debouncedSearch, locationFilter]);

  const exportInventorySql = useMemo(
    () =>
      buildInventoryQuerySql({
        search: '',
        location: 'all',
        type: 'ALL',
        sortBy: 'name',
        sortDirection: 'ASC',
        pageSize: 1000000,
        offset: 0,
      }),
    [],
  );

  const inventoryQuery = useQuery<InventoryRow>(inventorySql);
  const pagedCountQuery = useQuery<CountRow>(pagedCountSql);
  const typeCountsQuery = useQuery<TypeCountRow>(typeCountsSql);
  const exportInventoryQuery = useQuery<InventoryRow>(exportInventorySql);

  const statsQuery = useQuery<StatsRow>(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN type = 'PRODUCT' THEN 1 ELSE 0 END) AS products,
      SUM(CASE WHEN type = 'EQUIPMENT' THEN 1 ELSE 0 END) AS equipment,
      SUM(CASE WHEN type = 'TOOL' THEN 1 ELSE 0 END) AS tools,
      SUM(CASE WHEN type = 'KIT' THEN 1 ELSE 0 END) AS kits
    FROM items
  `);

  const locationsQuery = useQuery<LocationRow>(`
    SELECT DISTINCT location
    FROM items
    WHERE location IS NOT NULL
      AND location <> ''
      AND location <> '-'
    ORDER BY location ASC
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

  const tableItems = useMemo<InventoryItem[]>(
    () =>
      (inventoryQuery.data ?? []).map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        location: item.location,
        unit: item.unit,
        type: asItemType(item.type),
        imageUrl: item.image_url ?? '',
        warehouseInventory: Number(item.warehouse_inventory ?? 0),
        onsiteInventory: Number(item.onsite_inventory ?? 0),
        totalInventory: Number(item.total_inventory ?? 0),
      })),
    [inventoryQuery.data],
  );

  const exportItems = useMemo<InventoryItem[]>(
    () =>
      (exportInventoryQuery.data ?? []).map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        location: item.location,
        unit: item.unit,
        type: asItemType(item.type),
        imageUrl: item.image_url ?? '',
        warehouseInventory: Number(item.warehouse_inventory ?? 0),
        onsiteInventory: Number(item.onsite_inventory ?? 0),
        totalInventory: Number(item.total_inventory ?? 0),
      })),
    [exportInventoryQuery.data],
  );

  const statsData = useMemo<ItemStats>(() => {
    const row = statsQuery.data?.[0];
    if (!row) return DEFAULT_STATS;
    return {
      total: Number(row.total ?? 0),
      products: Number(row.products ?? 0),
      equipment: Number(row.equipment ?? 0),
      tools: Number(row.tools ?? 0),
      kits: Number(row.kits ?? 0),
    };
  }, [statsQuery.data]);

  const allLocations = useMemo(
    () => (locationsQuery.data ?? []).map((row) => row.location),
    [locationsQuery.data],
  );

  const countsData = useMemo<ItemCounts>(() => {
    const byType: Partial<Record<ItemType, number>> = {};
    for (const row of typeCountsQuery.data ?? []) {
      const type = asItemType(row.type);
      byType[type] = Number(row.total_count ?? 0);
    }

    const product = byType.PRODUCT ?? 0;
    const equipment = byType.EQUIPMENT ?? 0;
    const tool = byType.TOOL ?? 0;
    const kit = byType.KIT ?? 0;

    return {
      ALL: product + equipment + tool + kit,
      PRODUCT: product,
      EQUIPMENT: equipment,
      TOOL: tool,
      KIT: kit,
    };
  }, [typeCountsQuery.data]);

  const pageCount = useMemo(() => {
    const totalForType = Number(pagedCountQuery.data?.[0]?.total_count ?? 0);
    return Math.max(1, Math.ceil(totalForType / pagination.pageSize));
  }, [pagedCountQuery.data, pagination.pageSize]);

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

  const handleRowClick = useCallback((item: InventoryItem) => {
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

      <InventoryStats stats={statsData} />
      <InventoryTable
        items={tableItems}
        isLoading={inventoryQuery.isFetching && tableItems.length === 0}
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
        typeCounts={countsData}
        allLocations={allLocations}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        onRowClick={handleRowClick}
        exportItems={exportItems}
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
