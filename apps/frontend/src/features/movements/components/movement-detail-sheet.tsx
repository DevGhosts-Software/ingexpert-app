'use client';

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
  CalendarIcon,
  FileText,
  Loader2,
  MapPin,
  RotateCcw,
  Trash2,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@powersync/react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  PURCHASE: {
    icon: ArrowDownCircle,
    label: 'Compra',
    description: 'Ingreso de material al almacén',
    colors: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      badge:
        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    },
  },
  RETURN: {
    icon: RotateCcw,
    label: 'Devolución',
    description: 'Material que regresa al almacén',
    colors: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      badge:
        'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    },
  },
  EXIT: {
    icon: ArrowUpCircle,
    label: 'Salida',
    description: 'Material que sale del almacén',
    colors: {
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-600 dark:text-orange-400',
      badge:
        'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    },
  },
  WRITEOFF: {
    icon: Trash2,
    label: 'Baja',
    description: 'Baja definitiva de inventario',
    colors: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      badge:
        'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    },
  },
  STOCK_ADJUSTMENT_IN: {
    icon: ArrowDownCircle,
    label: 'Ajuste',
    description: 'Ajuste de stock de inventario',
    colors: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
      badge:
        'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    },
  },
  STOCK_ADJUSTMENT_OUT: {
    icon: ArrowUpCircle,
    label: 'Ajuste',
    description: 'Ajuste de stock de inventario',
    colors: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
      badge:
        'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    },
  },
  EXCEL_IMPORT: {
    icon: ArrowDownCircle,
    label: 'Importación Excel',
    description: 'Ingreso importado desde archivo Excel',
    colors: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'text-emerald-600 dark:text-emerald-400',
      badge:
        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    },
  },
} as const;

// ─── MetaRow ──────────────────────────────────────────────────────────────────

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="text-sm font-medium leading-snug">{value}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MovementDetailSheetProps {
  movementId: string;
  open: boolean;
  onClose: () => void;
}

type LocalMovementHeaderRow = {
  id: string;
  type: 'PURCHASE' | 'RETURN' | 'EXIT' | 'WRITEOFF' | 'EXCEL_IMPORT';
  created_by_id: string;
  destination: string | null;
  observations: string | null;
  responsible_delivery_id: string | null;
  responsible_receipt_id: string | null;
  date: string;
  project_id: string | null;
  items_count: number | string | null;
  project_name: string | null;
  creator_name: string | null;
  responsible_delivery_name: string | null;
  responsible_receipt_name: string | null;
};

type LocalMovementDetailRow = {
  id: string;
  movement_id: string;
  item_id: string;
  quantity: number | string | null;
  item_name: string;
  item_code: string;
  item_location: string;
  item_unit: string;
  item_type: string;
  item_image_url: string | null;
};

export function MovementDetailSheet({ movementId, open, onClose }: MovementDetailSheetProps) {
  const escapedMovementId = movementId.replaceAll("'", "''");
  const headerSql =
    open && movementId
      ? `
      SELECT
        m.id,
        m.type,
        m.created_by_id,
        m.destination,
        m.observations,
        m.responsible_delivery_id,
        m.responsible_receipt_id,
        m.date,
        m.project_id,
        COUNT(md.id) AS items_count,
        p.name AS project_name,
        creator.name AS creator_name,
        delivery.name AS responsible_delivery_name,
        receipt.name AS responsible_receipt_name
      FROM movements m
      LEFT JOIN movement_details md ON md.movement_id = m.id
      LEFT JOIN projects p ON p.id = m.project_id
      LEFT JOIN users creator ON creator.id = m.created_by_id
      LEFT JOIN users delivery ON delivery.id = m.responsible_delivery_id
      LEFT JOIN users receipt ON receipt.id = m.responsible_receipt_id
      WHERE m.id = '${escapedMovementId}'
      GROUP BY
        m.id, m.type, m.created_by_id, m.destination, m.observations,
        m.responsible_delivery_id, m.responsible_receipt_id, m.date, m.project_id,
        p.name, creator.name, delivery.name, receipt.name
      LIMIT 1
    `
      : 'SELECT * FROM movements WHERE 1 = 0';
  const detailsSql =
    open && movementId
      ? `
      SELECT
        md.id,
        md.movement_id,
        md.item_id,
        md.quantity,
        i.name AS item_name,
        i.code AS item_code,
        i.location AS item_location,
        i.unit AS item_unit,
        i.type AS item_type,
        i.image_url AS item_image_url
      FROM movement_details md
      INNER JOIN items i ON i.id = md.item_id
      WHERE md.movement_id = '${escapedMovementId}'
      ORDER BY i.name ASC
    `
      : 'SELECT * FROM movement_details WHERE 1 = 0';

  const headerQuery = useQuery<LocalMovementHeaderRow>(headerSql);
  const detailsQuery = useQuery<LocalMovementDetailRow>(detailsSql);
  const movementHeader = headerQuery.data?.[0];
  const movement = movementHeader
    ? {
        id: movementHeader.id,
        type: movementHeader.type,
        createdById: movementHeader.created_by_id,
        destination: movementHeader.destination,
        observations: movementHeader.observations,
        responsibleDeliveryId: movementHeader.responsible_delivery_id,
        responsibleReceiptId: movementHeader.responsible_receipt_id,
        date: movementHeader.date,
        projectId: movementHeader.project_id,
        itemsCount: Number(movementHeader.items_count ?? 0),
        projectName: movementHeader.project_name,
        creatorName: movementHeader.creator_name,
        responsibleDeliveryName: movementHeader.responsible_delivery_name,
        responsibleReceiptName: movementHeader.responsible_receipt_name,
        details: (detailsQuery.data ?? []).map((detail) => ({
          id: detail.id,
          movementId: detail.movement_id,
          itemId: detail.item_id,
          quantity: Number(detail.quantity ?? 0),
          item: {
            id: detail.item_id,
            code: detail.item_code,
            name: detail.item_name,
            location: detail.item_location,
            unit: detail.item_unit,
            type: detail.item_type,
            imageUrl: detail.item_image_url ?? '',
          },
        })),
      }
    : null;
  const isLoading = !movement && (headerQuery.isFetching || detailsQuery.isFetching);

  const config = movement ? TYPE_CONFIG[movement.type] : null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        {/* Colored type header */}
        {config && movement ? (
          <div className={`px-6 pt-6 pb-5 border-b ${config.colors.bg} ${config.colors.border}`}>
            <SheetHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge
                  className={`gap-1.5 text-sm px-3 py-1 font-medium border ${config.colors.badge}`}
                >
                  <config.icon className="h-4 w-4" />
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  #{movement.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div>
                <SheetTitle className="text-base">{config.description}</SheetTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {format(new Date(movement.date), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", {
                    locale: es,
                  })}
                </p>
              </div>
            </SheetHeader>
          </div>
        ) : (
          <div className="px-6 pt-6 pb-5 border-b">
            <SheetHeader>
              <SheetTitle>Detalle del movimiento</SheetTitle>
            </SheetHeader>
          </div>
        )}

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center flex-1 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando...
          </div>
        ) : !movement ? null : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-5 space-y-6">
              {/* Context — type-specific metadata */}
              <div className="divide-y">
                <MetaRow icon={User} label="Registrado por" value={movement.creatorName ?? '—'} />

                {/* PURCHASE */}
                {movement.type === 'PURCHASE' && movement.responsibleReceiptName && (
                  <MetaRow
                    icon={User}
                    label="Recibido por"
                    value={movement.responsibleReceiptName}
                  />
                )}

                {/* RETURN */}
                {movement.type === 'RETURN' && movement.projectName && (
                  <MetaRow icon={Briefcase} label="Proyecto origen" value={movement.projectName} />
                )}
                {movement.type === 'RETURN' && movement.responsibleReceiptName && (
                  <MetaRow
                    icon={User}
                    label="Devuelto por"
                    value={movement.responsibleReceiptName}
                  />
                )}

                {/* EXIT */}
                {movement.type === 'EXIT' && movement.destination && (
                  <MetaRow icon={MapPin} label="Destino" value={movement.destination} />
                )}
                {movement.type === 'EXIT' && movement.projectName && (
                  <MetaRow icon={Briefcase} label="Proyecto destino" value={movement.projectName} />
                )}
                {movement.type === 'EXIT' && movement.responsibleDeliveryName && (
                  <MetaRow
                    icon={User}
                    label="Entregado por"
                    value={movement.responsibleDeliveryName}
                  />
                )}

                <MetaRow
                  icon={CalendarIcon}
                  label="Fecha y hora"
                  value={format(new Date(movement.date), "dd/MM/yyyy 'a las' HH:mm", {
                    locale: es,
                  })}
                />
              </div>

              {/* Observations — highlighted block */}
              {movement.observations && (
                <div className="rounded-md border bg-muted/40 p-3 flex gap-2.5">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Observaciones
                    </p>
                    <p className="text-sm leading-relaxed">{movement.observations}</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Items */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Ítems ({movement.details.length})
                </h4>
                {movement.details.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
                    Sin ítems registrados
                  </p>
                ) : (
                  <div className="border rounded-md divide-y text-sm">
                    <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-1.5 bg-muted/40 text-xs font-medium text-muted-foreground">
                      <span>Ítem</span>
                      <span className="text-right">Cantidad</span>
                    </div>
                    {movement.details.map((detail) => (
                      <div
                        key={detail.id}
                        className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2.5 items-center"
                      >
                        <div className="min-w-0">
                          <p className="font-medium leading-tight truncate">{detail.item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {detail.item.code}
                          </p>
                        </div>
                        <span className="text-right font-mono text-sm whitespace-nowrap tabular-nums">
                          {detail.quantity} {detail.item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
