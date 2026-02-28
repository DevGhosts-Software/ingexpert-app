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

import { trpc } from '@/lib/trpc';
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
      badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
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
        'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
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
        'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
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
      badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
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

export function MovementDetailSheet({ movementId, open, onClose }: MovementDetailSheetProps) {
  const { data: movement, isLoading } = trpc.movements.getById.useQuery(movementId, {
    enabled: open,
  });

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
