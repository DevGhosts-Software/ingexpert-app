import { useState } from 'react';
import type { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalSelected?: number;
  /** Controlled page index (0-based). When provided, used instead of table.getState(). */
  pageIndex?: number;
  /** Controlled page size. When provided, used instead of table.getState(). */
  pageSize?: number;
  /** Total page count. When provided, used instead of table.getPageCount(). */
  pageCount?: number;
  onPageSizeChange?: (size: number) => void;
}

export function DataTablePagination<TData>({
  table,
  totalSelected = 0,
  pageIndex: pageIndexProp,
  pageSize: pageSizeProp,
  pageCount: pageCountProp,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  const tableState = table.getState().pagination;
  const pageIndex = pageIndexProp ?? tableState.pageIndex;
  const pageSize = pageSizeProp ?? tableState.pageSize;
  const pageCount = pageCountProp ?? table.getPageCount();

  const [inputValue, setInputValue] = useState('');

  const handlePageSizeChange = (v: string) => {
    const newSize = Number(v);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    } else {
      table.setPageSize(newSize);
    }
  };

  const commitPage = () => {
    const parsed = parseInt(inputValue, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(1, Math.min(parsed, pageCount));
      table.setPageIndex(clamped - 1);
    }
    setInputValue('');
  };

  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-xs text-muted-foreground">
        {totalSelected > 0
          ? `${totalSelected} fila(s) seleccionada(s)`
          : `Página ${pageIndex + 1} de ${pageCount}`}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium">Filas por página</p>
          <Select value={`${pageSize}`} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-8 w-17.5 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50].map((s) => (
                <SelectItem key={s} value={`${s}`} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium hidden sm:block">Ir a</p>
          <Input
            type="number"
            min={1}
            max={pageCount}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commitPage()}
            onBlur={commitPage}
            placeholder={`${pageIndex + 1}`}
            className="h-8 w-14 text-xs text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(0)}
            disabled={pageIndex === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">Primera página</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={pageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={pageIndex >= pageCount - 1}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Siguiente página</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Última página</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
