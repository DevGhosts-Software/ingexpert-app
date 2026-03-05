'use client';

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

import { getColumns } from './user-table.columns';
import { UserTableToolbar } from './user-table-toolbar';
import { type UserTableProps } from './user-table.types';

export type { UserEntity, UserRole, UserTableProps } from './user-table.types';

const COLUMNS = getColumns();

export function UserTable({
  users,
  isLoading = false,
  pageCount,
  pagination,
  onPaginationChange,
  search,
  onSearchChange,
  activeTab,
  onActiveTabChange,
  workAreaFilter,
  onWorkAreaFilterChange,
  workAreas,
  sorting,
  onSortingChange,
  roleCounts,
}: UserTableProps) {
  const table = useReactTable({
    data: users,
    columns: COLUMNS,
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

  return (
    <div className="space-y-4">
      <UserTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        workAreaFilter={workAreaFilter}
        onWorkAreaFilterChange={onWorkAreaFilterChange}
        workAreas={workAreas}
        activeTab={activeTab}
        onActiveTabChange={onActiveTabChange}
        roleCounts={roleCounts}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    style={h.column.getSize() !== 150 ? { width: h.column.getSize() } : undefined}
                  >
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
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
