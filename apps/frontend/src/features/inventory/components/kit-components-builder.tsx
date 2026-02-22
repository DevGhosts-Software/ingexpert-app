'use client';

import { useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type LocalComponent = {
  componentId: string;
  name: string;
  code: string;
  unit: string;
  stock: number;
  quantity: number;
};

// ─── Search input ─────────────────────────────────────────────────────────────

export function AddComponentInput({
  excludeIds,
  onAdd,
  disabled,
}: {
  excludeIds: string[];
  onAdd: (item: LocalComponent) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isFetching } = trpc.items.list.useQuery(
    { page: 1, limit: 8, search: debouncedQuery || undefined },
    { enabled: debouncedQuery.trim().length >= 2 },
  );

  const isSearching = isFetching || (query.trim().length >= 2 && debouncedQuery !== query);

  const filtered = useMemo(
    () =>
      (results?.data ?? [])
        .filter((i) => !excludeIds.includes(i.id))
        .map((i) => ({ ...i, stock: Number(i.stock) })),
    [results, excludeIds],
  );

  const showDropdown =
    open && debouncedQuery.trim().length >= 2 && (filtered.length > 0 || isSearching);

  const showEmpty =
    open && debouncedQuery.trim().length >= 2 && !isSearching && filtered.length === 0;

  const handleSelect = (item: (typeof filtered)[0]) => {
    onAdd({
      componentId: item.id,
      name: item.name,
      code: item.code,
      unit: item.unit,
      stock: item.stock,
      quantity: 1,
    });
    setQuery('');
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          placeholder="Buscar ítem para agregar..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="h-8 text-sm pr-8"
        />
        {isSearching && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground pointer-events-none" />
        )}
      </div>
      {(showDropdown || showEmpty) && (
        <ul className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
          {isSearching && filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Buscando...
            </li>
          ) : showEmpty ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">Sin resultados</li>
          ) : (
            filtered.map((item, i) => (
              <li
                key={item.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer flex justify-between items-center gap-2',
                  i === highlighted && 'bg-accent',
                )}
              >
                <span className="truncate">{item.name}</span>
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {item.code}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Components builder (presentational) ─────────────────────────────────────

interface KitComponentsBuilderProps {
  components: LocalComponent[];
  excludeIds: string[];
  onAdd: (item: LocalComponent) => void;
  onRemove: (componentId: string) => void;
  onQtyChange: (componentId: string, qty: number) => void;
  disabled?: boolean;
}

export function KitComponentsBuilder({
  components,
  excludeIds,
  onAdd,
  onRemove,
  onQtyChange,
  disabled,
}: KitComponentsBuilderProps) {
  return (
    <div className="space-y-2">
      {/* Search first so dropdown opens downward over the list, not off-screen */}
      <AddComponentInput excludeIds={excludeIds} onAdd={onAdd} disabled={disabled} />

      {components.length > 0 && (
        <div className="border rounded-md divide-y text-sm">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 bg-muted/40 text-xs font-medium text-muted-foreground">
            <span>Componente</span>
            <span className="text-right">Cantidad</span>
            <span />
          </div>
          {components.map((comp) => (
            <div
              key={comp.componentId}
              className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 items-center"
            >
              <div className="min-w-0">
                <p className="font-medium leading-tight truncate">{comp.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{comp.code}</p>
              </div>
              <Input
                type="number"
                min={1}
                value={comp.quantity}
                onChange={(e) => onQtyChange(comp.componentId, parseInt(e.target.value, 10))}
                className="h-7 w-16 text-xs text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(comp.componentId)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {components.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
          Sin componentes — busca ítems arriba para agregar
        </p>
      )}
    </div>
  );
}
