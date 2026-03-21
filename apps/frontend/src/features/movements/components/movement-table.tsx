'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
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
import { getColumns, MOVEMENT_ROW_ACCENT } from './movement-table.columns';
import { MovementDetailSheet } from './movement-detail-sheet';
import { MovementFormSheet } from './movement-form-sheet';
import { MovementTableToolbar } from './movement-table-toolbar';
import type { MovementRow, MovementTableMeta, MovementTableProps } from './movement-table.types';

export function MovementTable({
  movements,
  exportMovements,
  exportDetails,
  isLoading,
  pageCount,
  pagination,
  onPaginationChange,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  projectFilter,
  onProjectFilterChange,
  projects,
  typeCounts,
  sorting,
  onSortingChange,
  isAdmin,
  users,
  creatorFilter,
  onCreatorFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: MovementTableProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const validIds = new Set(exportMovements.map((movement) => movement.id));
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
  }, [exportMovements]);

  const currentScopeIds = useMemo(
    () => exportMovements.map((movement) => movement.id),
    [exportMovements],
  );

  const selectedCount = selectedIds.size;

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
      checked: exportMovements.length > 0 && selectedCount === exportMovements.length,
      indeterminate: selectedCount > 0 && selectedCount < exportMovements.length,
    }),
    [exportMovements.length, selectedCount],
  );

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
      if (prev.size === exportMovements.length && exportMovements.length > 0) {
        return new Set();
      }

      return new Set(exportMovements.map((movement) => movement.id));
    });
  }, [exportMovements]);

  const isRowSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const tableMeta = useMemo<MovementTableMeta>(
    () => ({
      selectionState: headerSelectionState,
      onToggleScope: handleToggleCurrentScope,
      isRowSelected,
      onToggleRow: handleToggleRow,
    }),
    [handleToggleCurrentScope, handleToggleRow, headerSelectionState, isRowSelected],
  );

  const columns = useMemo(() => getColumns(), []);

  const table = useReactTable({
    data: movements,
    columns,
    meta: tableMeta,
    pageCount,
    state: { sorting, pagination },
    getRowId: (row) => row.id,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onSortingChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <MovementTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={onTypeFilterChange}
        projectFilter={projectFilter}
        onProjectFilterChange={onProjectFilterChange}
        projects={projects}
        typeCounts={typeCounts}
        isAdmin={isAdmin}
        users={users}
        creatorFilter={creatorFilter}
        onCreatorFilterChange={onCreatorFilterChange}
        dateFrom={dateFrom}
        onDateFromChange={onDateFromChange}
        dateTo={dateTo}
        onDateToChange={onDateToChange}
        exportMovements={exportMovements}
        exportDetails={exportDetails}
        selectedIds={selectedIds}
        selectedCount={selectedCount}
        hasSelection={selectedCount > 0}
        globalSelectionChecked={globalSelectionState.checked}
        globalSelectionIndeterminate={globalSelectionState.indeterminate}
        onToggleGlobalSelection={handleToggleGlobalSelection}
        onCreate={() => setCreateOpen(true)}
      />

      <MovementFormSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <MovementDetailSheet
        movementId={detailId ?? ''}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      (header.column.columnDef.meta as { width?: string } | undefined)?.width
                    }
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className={
                          (header.column.columnDef.meta as { center?: boolean } | undefined)?.center
                            ? 'flex justify-center'
                            : ''
                        }
                      >
                        <button
                          onClick={() =>
                            header.column.toggleSorting(header.column.getIsSorted() === 'asc')
                          }
                          className="group flex items-center gap-1 hover:text-foreground font-medium"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                          )}
                        </button>
                      </div>
                    ) : (header.column.columnDef.meta as { center?: boolean } | undefined)
                        ?.center ? (
                      <div className="flex justify-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pagination.pageSize }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
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
                  No se encontraron movimientos.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={selectedIds.has(row.original.id) ? 'selected' : undefined}
                  className="cursor-pointer"
                  style={{
                    boxShadow:
                      MOVEMENT_ROW_ACCENT[
                        row.original.type as keyof typeof MOVEMENT_ROW_ACCENT
                      ] ?? undefined,
                  }}
                  onClick={() => setDetailId(row.original.id)}
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
