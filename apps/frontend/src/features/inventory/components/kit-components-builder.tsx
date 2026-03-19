'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@powersync/react';
import { Loader2, X } from 'lucide-react';

import { type ItemType } from '@ingexpert/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { TYPE_CONFIG } from './inventory-table.types';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type LocalComponent = {
  componentId: string;
  name: string;
  code: string;
  unit: string;
  totalInventory: number;
  quantity: number;
  type: ItemType;
};

// ─── Search input ─────────────────────────────────────────────────────────────

export function AddComponentInput({
  excludeIds,
  onAdd,
  disabled,
  allowedTypes,
}: {
  excludeIds: string[];
  onAdd: (item: LocalComponent) => void;
  disabled?: boolean;
  /** If provided, only items of these types are returned from the server. */
  allowedTypes?: ItemType[];
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);

  const normalizedQuery = debouncedQuery.trim().toLowerCase();
  const escapedQuery = normalizedQuery.replaceAll("'", "''");
  const typeFilterSql =
    allowedTypes && allowedTypes.length > 0
      ? `AND type IN (${allowedTypes.map((type) => `'${type}'`).join(', ')})`
      : '';
  const searchSql =
    normalizedQuery.length >= 2
      ? `
      WITH candidates AS (
        SELECT id, name, code, unit, type
        FROM items
        WHERE (
          LOWER(name) LIKE '%${escapedQuery}%'
          OR LOWER(code) LIKE '%${escapedQuery}%'
        )
        ${typeFilterSql}
      ),
      movement_totals AS (
        SELECT
          md.item_id,
          SUM(
            CASE
              WHEN LOWER(TRIM(m.type)) IN ('compra', 'purchase', 'devolucion', 'return')
                THEN ABS(COALESCE(md.quantity, 0))
              WHEN LOWER(TRIM(m.type)) IN ('salida', 'exit', 'baja', 'writeoff', 'ajuste_negativo')
                THEN -ABS(COALESCE(md.quantity, 0))
              WHEN LOWER(TRIM(m.type)) IN ('ajuste_positivo')
                THEN ABS(COALESCE(md.quantity, 0))
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
        INNER JOIN candidates c ON c.id = md.item_id
        GROUP BY md.item_id
      )
      SELECT
        c.id,
        c.name,
        c.code,
        c.unit,
        c.type,
        COALESCE(
          COALESCE(mt.warehouse_delta, 0) + COALESCE(mt.onsite_delta, 0),
          0
        ) AS total_inventory
      FROM candidates c
      LEFT JOIN movement_totals mt ON mt.item_id = c.id
      WHERE (
        LOWER(c.name) LIKE '%${escapedQuery}%'
        OR LOWER(c.code) LIKE '%${escapedQuery}%'
      )
      ORDER BY c.name ASC
      LIMIT 10
    `
      : "SELECT id, name, code, unit, type, 0 AS total_inventory FROM items WHERE 1 = 0";
  const { data: results, isFetching } = useQuery<{
    id: string;
    name: string;
    code: string;
    unit: string;
    total_inventory: number | string | null;
    type: ItemType;
  }>(searchSql);

  const isSearching = isFetching || (query.trim().length >= 2 && debouncedQuery !== query);

  const filtered = useMemo(
    () =>
      (results ?? [])
        .filter((i) => !excludeIds.includes(i.id))
        .map((i) => ({ ...i, totalInventory: Number(i.total_inventory ?? 0) })),
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
      totalInventory: item.totalInventory,
      quantity: 1,
      type: item.type as ItemType,
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
          placeholder={
            allowedTypes?.length
              ? `Buscar ${allowedTypes.map((t) => TYPE_CONFIG[t].label.toLowerCase()).join(' o ')}...`
              : 'Buscar ítem para agregar...'
          }
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
        <ul className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-56 overflow-y-auto">
          {isSearching && filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Buscando...
            </li>
          ) : showEmpty ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">Sin resultados</li>
          ) : (
            filtered.map((item, i) => {
              const config = TYPE_CONFIG[item.type as ItemType];
              const TypeIcon = config.icon;
              const isKit = item.type === 'KIT';
              return (
                <li
                  key={item.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    'px-3 py-2 text-sm cursor-pointer flex items-center gap-2',
                    i === highlighted && 'bg-accent',
                  )}
                >
                  {/* Icon */}
                  <TypeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                  {/* Name + code */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{item.code}</p>
                  </div>

                  {/* Type + stock */}
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {config.label}
                    </span>
                    {isKit ? (
                      <span className="text-[11px] text-primary font-medium leading-tight">
                        → expandir
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'text-[11px] font-mono leading-tight',
                          item.totalInventory === 0
                            ? 'text-destructive'
                            : item.totalInventory <= 5
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {item.totalInventory} {item.unit}
                      </span>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Quantity input with free-form editing ────────────────────────────────────

function QtyInput({
  componentId,
  value,
  onQtyChange,
  disabled,
}: {
  componentId: string;
  value: number;
  onQtyChange: (componentId: string, qty: number) => void;
  disabled?: boolean;
}) {
  const [display, setDisplay] = useState(String(value));

  // Sync when parent resets the value (e.g. sheet close)
  useEffect(() => {
    setDisplay(String(value));
  }, [value]);

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={display}
      disabled={disabled}
      className="h-7 w-16 text-xs text-right"
      onChange={(e) => {
        const raw = e.target.value;
        setDisplay(raw);
        const n = parseInt(raw, 10);
        if (!isNaN(n) && n >= 1) onQtyChange(componentId, n);
      }}
      onBlur={() => {
        const n = parseInt(display, 10);
        const safe = isNaN(n) || n < 1 ? 1 : n;
        setDisplay(String(safe));
        onQtyChange(componentId, safe);
      }}
    />
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
  /** If provided, search is restricted to these types (server-side). */
  allowedTypes?: ItemType[];
}

export function KitComponentsBuilder({
  components,
  excludeIds,
  onAdd,
  onRemove,
  onQtyChange,
  disabled,
  allowedTypes,
}: KitComponentsBuilderProps) {
  return (
    <div className="space-y-2">
      {/* Search first so dropdown opens downward over the list, not off-screen */}
      <AddComponentInput
        excludeIds={excludeIds}
        onAdd={onAdd}
        disabled={disabled}
        allowedTypes={allowedTypes}
      />

      {components.length > 0 && (
        <div className="border rounded-md divide-y text-sm">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 px-3 py-1.5 bg-muted/40 text-xs font-medium text-muted-foreground">
            <span />
            <span>Componente</span>
            <span className="text-right">Cantidad</span>
            <span />
          </div>
          {components.map((comp) => {
            const config = TYPE_CONFIG[comp.type];
            const TypeIcon = config.icon;
            return (
              <div
                key={comp.componentId}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-2 px-3 py-2 items-center"
              >
                <TypeIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium leading-tight truncate">{comp.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{comp.code}</p>
                </div>
                <QtyInput
                  componentId={comp.componentId}
                  value={comp.quantity}
                  onQtyChange={onQtyChange}
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
            );
          })}
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
