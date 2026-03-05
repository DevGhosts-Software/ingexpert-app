'use client';

import { useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

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

import { getColumns } from './inventory-table.columns';
import { InventoryTableToolbar } from './inventory-table-toolbar';
import { type InventoryTableProps } from './inventory-table.types';

export type { InventoryItem, ItemType, InventoryTableProps } from './inventory-table.types';

export function InventoryTable({
  items,
  isLoading = false,
  isAdmin,
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
  onRowClick,
}: InventoryTableProps) {
  const [stockLevelFilter, setStockLevelFilter] = useState('all');

  const filteredItems = useMemo(() => {
    if (stockLevelFilter === 'all') return items;
    if (stockLevelFilter === 'out') return items.filter((i) => i.stock === 0);
    if (stockLevelFilter === 'ok') return items.filter((i) => i.stock > 0);
    return items;
  }, [items, stockLevelFilter]);

  const pageLocations = useMemo(
    () => Array.from(new Set(items.map((i) => i.location))).sort(),
    [items],
  );
  const locationOptions = allLocations && allLocations.length > 0 ? allLocations : pageLocations;

  const columns = useMemo(() => getColumns(isAdmin), [isAdmin]);

  const table = useReactTable({
    data: filteredItems,
    columns,
    pageCount,
    state: { sorting, pagination },
    onSortingChange,
    onPaginationChange,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

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
        isAdmin={isAdmin}
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
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No se encontraron items.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer"
                  onClick={() => onRowClick(row.original)}
                >
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
