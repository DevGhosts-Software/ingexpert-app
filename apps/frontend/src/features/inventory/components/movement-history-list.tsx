'use client';

import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Loader2,
  RotateCcw,
  ShoppingCart,
  Trash2,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export type MovementHistoryRow = {
  movement_id: string;
  movement_type: string;
  movement_destination: string | null;
  movement_observations: string | null;
  date: string;
  quantity: number | string | null;
};

type MovementTypeConfig = {
  label: string;
  icon: React.ElementType;
};

function getMovementTypeConfig(value: string): MovementTypeConfig {
  const normalized = value.toLowerCase().trim();
  if (normalized === 'excel_import') {
    return { label: 'Importación Excel', icon: Download };
  }
  if (normalized === 'stock_adjustment_in' || normalized === 'ajuste_positivo') {
    return { label: 'Ajuste (+)', icon: ArrowDownLeft };
  }
  if (normalized === 'stock_adjustment_out' || normalized === 'ajuste_negativo') {
    return { label: 'Ajuste (-)', icon: ArrowUpRight };
  }
  if (normalized === 'compra' || normalized === 'purchase') {
    return { label: 'Compra', icon: ShoppingCart };
  }
  if (normalized === 'salida' || normalized === 'exit') {
    return { label: 'Salida', icon: Truck };
  }
  if (normalized === 'devolucion' || normalized === 'return') {
    return { label: 'Devolución', icon: RotateCcw };
  }
  if (normalized === 'baja' || normalized === 'writeoff') {
    return { label: 'Baja', icon: Trash2 };
  }
  return { label: value, icon: Truck };
}

interface MovementHistoryListProps {
  itemId: string;
  maxItems?: number;
}

export function MovementHistoryList({ itemId, maxItems = 12 }: MovementHistoryListProps) {
  const historySql = useMemo(
    () => `
      SELECT
        m.id AS movement_id,
        LOWER(m.type) AS movement_type,
        m.destination AS movement_destination,
        m.observations AS movement_observations,
        m.date,
        md.quantity
      FROM movement_details md
      INNER JOIN movements m ON m.id = md.movement_id
      WHERE md.item_id = '${itemId.replaceAll("'", "''")}'
        AND m.type IN (
          'PURCHASE',
          'RETURN',
          'EXIT',
          'WRITEOFF',
          'STOCK_ADJUSTMENT_IN',
          'STOCK_ADJUSTMENT_OUT',
          'EXCEL_IMPORT'
        )
      ORDER BY m.date DESC
      LIMIT ${maxItems}
    `,
    [itemId, maxItems],
  );
  const historyQuery = useQuery<MovementHistoryRow>(historySql);

  if (historyQuery.isFetching && (historyQuery.data?.length ?? 0) === 0) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando historial...
      </div>
    );
  }

  if ((historyQuery.data?.length ?? 0) === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
        Sin movimientos visibles para este ítem.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Historial de movimientos
      </h4>
      <div className="border rounded-md divide-y text-sm">
        {(historyQuery.data ?? []).map((movement) => {
          const config = getMovementTypeConfig(movement.movement_type);
          const Icon = config.icon;
          return (
            <div
              key={`${movement.movement_id}-${movement.date}`}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <div className="shrink-0 p-1.5 rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium leading-tight">{config.label}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(movement.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
              <span className="font-mono tabular-nums text-sm whitespace-nowrap">
                {Number(movement.quantity ?? 0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
