'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { type InventoryTableProps, TYPE_COLORS } from './inventory-table.types';

export type { InventoryItem, ItemType, InventoryTableProps } from './inventory-table.types';

export function InventoryTable({
  items,
  exportItems,
  exportKitRows,
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
  const [imageFilter, setImageFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const validIds = new Set(exportItems.map((item) => item.id));
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<string>();

      for (const id of prev) {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [exportItems]);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (imageFilter === 'has') result = result.filter((i) => !!i.imageUrl);
    if (imageFilter === 'missing') result = result.filter((i) => !i.imageUrl);
    return result;
  }, [items, imageFilter]);

  const filteredExportItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const baseItems = exportItems.filter((item) => {
      const matchesSearch =
        normalizedSearch === '' ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.code.toLowerCase().includes(normalizedSearch) ||
        item.location.toLowerCase().includes(normalizedSearch);
      const matchesLocation = locationFilter === 'all' || item.location === locationFilter;
      const matchesImage =
        imageFilter === 'all' || (imageFilter === 'has' ? Boolean(item.imageUrl) : !item.imageUrl);

      return matchesSearch && matchesLocation && matchesImage;
    });

    if (typeFilter === 'ALL') {
      return baseItems;
    }

    return baseItems.filter((item) => item.type === typeFilter);
  }, [exportItems, imageFilter, locationFilter, search, typeFilter]);

  const selectedCount = selectedIds.size;
  const currentScopeIds = useMemo(
    () => filteredExportItems.map((item) => item.id),
    [filteredExportItems],
  );

  const selectedInCurrentScopeCount = useMemo(() => {
    let count = 0;
    for (const id of currentScopeIds) {
      if (selectedIds.has(id)) {
        count += 1;
      }
    }
    return count;
  }, [currentScopeIds, selectedIds]);

  const headerSelectionState = useMemo(
    () => ({
      checked: currentScopeIds.length > 0 && selectedInCurrentScopeCount === currentScopeIds.length,
      indeterminate:
        selectedInCurrentScopeCount > 0 && selectedInCurrentScopeCount < currentScopeIds.length,
    }),
    [currentScopeIds.length, selectedInCurrentScopeCount],
  );

  const globalSelectionState = useMemo(
    () => ({
      checked: exportItems.length > 0 && selectedCount === exportItems.length,
      indeterminate: selectedCount > 0 && selectedCount < exportItems.length,
    }),
    [exportItems.length, selectedCount],
  );

  const pageLocations = useMemo(
    () => Array.from(new Set(items.map((i) => i.location))).sort(),
    [items],
  );
  const locationOptions = allLocations && allLocations.length > 0 ? allLocations : pageLocations;

  const handleToggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleCurrentScope = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const shouldSelectAll = currentScopeIds.some((id) => !next.has(id));

      if (shouldSelectAll) {
        for (const id of currentScopeIds) {
          next.add(id);
        }
      } else {
        for (const id of currentScopeIds) {
          next.delete(id);
        }
      }

      return next;
    });
  }, [currentScopeIds]);

  const handleToggleGlobalSelection = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === exportItems.length && exportItems.length > 0) {
        return new Set();
      }

      return new Set(exportItems.map((item) => item.id));
    });
  }, [exportItems]);

  const isRowSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const columns = useMemo(
    () =>
      getColumns({
        isAdmin,
        selectionState: headerSelectionState,
        onToggleScope: handleToggleCurrentScope,
        isRowSelected,
        onToggleRow: handleToggleRow,
      }),
    [handleToggleCurrentScope, handleToggleRow, headerSelectionState, isAdmin, isRowSelected],
  );

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
        imageFilter={imageFilter}
        onImageFilterChange={setImageFilter}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        typeCounts={typeCounts}
        isAdmin={isAdmin}
        exportItems={exportItems}
        exportKitRows={exportKitRows}
        selectedIds={selectedIds}
        hasSelection={selectedCount > 0}
        globalSelectionChecked={globalSelectionState.checked}
        globalSelectionIndeterminate={globalSelectionState.indeterminate}
        onToggleGlobalSelection={handleToggleGlobalSelection}
      />

      <div className="rounded-md border overflow-x-auto">
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
                  data-state={selectedIds.has(row.original.id) ? 'selected' : undefined}
                  className="cursor-pointer"
                  style={{ boxShadow: TYPE_COLORS[row.original.type].rowAccent }}
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
