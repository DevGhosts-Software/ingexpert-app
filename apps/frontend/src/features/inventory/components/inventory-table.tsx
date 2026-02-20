'use client';

import { useMemo, useState } from 'react';
import {
  type OnChangeFn,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { COLUMNS } from './inventory-table.columns';
import { InventoryTableToolbar } from './inventory-table-toolbar';
import { LOW_STOCK_THRESHOLD, type InventoryTableProps } from './inventory-table.types';

export type { InventoryItem, ItemType, InventoryTableProps } from './inventory-table.types';

export function InventoryTable({
  items,
  isLoading = false,
  pageCount,
  pagination,
  onPaginationChange,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  locationFilter,
  onLocationFilterChange,
  typeCounts,
  allLocations,
  sorting,
  onSortingChange,
}: InventoryTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [stockLevelFilter, setStockLevelFilter] = useState('all');

  const filteredItems = useMemo(() => {
    if (stockLevelFilter === 'all') return items;
    if (stockLevelFilter === 'low')
      return items.filter((i) => i.stock > 0 && i.stock < LOW_STOCK_THRESHOLD);
    if (stockLevelFilter === 'out') return items.filter((i) => i.stock === 0);
    if (stockLevelFilter === 'ok') return items.filter((i) => i.stock >= LOW_STOCK_THRESHOLD);
    return items;
  }, [items, stockLevelFilter]);

  const pageLocations = useMemo(
    () => Array.from(new Set(items.map((i) => i.location))).sort(),
    [items],
  );
  const locationOptions = allLocations && allLocations.length > 0 ? allLocations : pageLocations;

  const table = useReactTable({
    data: filteredItems,
    columns: COLUMNS,
    pageCount,
    state: { sorting, rowSelection, pagination },
    onSortingChange,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const totalSelected = Object.keys(rowSelection).length;

  const activeTab = typeFilter === 'ALL' ? 'all' : typeFilter.toLowerCase();

  const handleTabChange = (value: string) => {
    const typeMap: Record<string, Parameters<typeof onTypeFilterChange>[0]> = {
      all: 'ALL',
      product: 'PRODUCT',
      equipment: 'EQUIPMENT',
      tool: 'TOOL',
      kit: 'KIT',
    };
    onTypeFilterChange(typeMap[value] ?? 'ALL');
  };

  const handlePaginationChange: OnChangeFn<typeof pagination> = (updater) => {
    onPaginationChange(updater);
  };

  return (
    <div className="space-y-4">
      <InventoryTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        locationFilter={locationFilter}
        onLocationFilterChange={onLocationFilterChange}
        locationOptions={locationOptions}
        stockLevelFilter={stockLevelFilter}
        onStockLevelFilterChange={setStockLevelFilter}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        typeCounts={typeCounts}
        totalSelected={totalSelected}
        onClearSelection={() => table.resetRowSelection()}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {COLUMNS.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No se encontraron items.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        table={table}
        totalSelected={totalSelected}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        pageCount={pageCount}
        onPageSizeChange={(size) =>
          onPaginationChange({ ...pagination, pageSize: size, pageIndex: 0 })
        }
      />
    </div>
  );
}
