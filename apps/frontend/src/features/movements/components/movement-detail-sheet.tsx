'use client';

import { CalendarIcon, ClipboardList, Loader2, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { trpc } from '@/lib/trpc';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { TypeBadge } from './movement-table.columns';

interface MovementDetailSheetProps {
  movementId: string;
  open: boolean;
  onClose: () => void;
}

export function MovementDetailSheet({ movementId, open, onClose }: MovementDetailSheetProps) {
  const { data: movement, isLoading } = trpc.movements.getById.useQuery(movementId, {
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Detalle del Movimiento
          </SheetTitle>
          {movement && (
            <SheetDescription>
              Registro #{movement.id.slice(0, 8).toUpperCase()} —{' '}
              {format(new Date(movement.date), "dd 'de' MMMM 'de' yyyy", { locale: es })}
            </SheetDescription>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando movimiento...
          </div>
        ) : !movement ? null : (
          <div className="mt-6 space-y-6 pr-1 pb-4">
            <div className="flex items-center justify-between">
              <TypeBadge type={movement.type} />
              <span className="text-sm text-muted-foreground">
                {format(new Date(movement.date), 'HH:mm', { locale: es })} hs
              </span>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Personal
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Creado por:</span>
                  <span className="font-medium">{movement.creatorName ?? '—'}</span>
                </div>
                {movement.responsibleDeliveryName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Resp. entrega:</span>
                    <span className="font-medium">{movement.responsibleDeliveryName}</span>
                  </div>
                )}
                {movement.responsibleReceiptName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Resp. recepción:</span>
                    <span className="font-medium">{movement.responsibleReceiptName}</span>
                  </div>
                )}
                {movement.destination && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Destino:</span>
                    <span className="font-medium">{movement.destination}</span>
                  </div>
                )}
                {movement.projectName && (
                  <div className="flex items-center gap-2 text-sm">
                    <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Proyecto:</span>
                    <span className="font-medium">{movement.projectName}</span>
                  </div>
                )}
                {movement.date && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Fecha:</span>
                    <span className="font-medium">
                      {format(new Date(movement.date), "dd/MM/yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

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
                      className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 items-center"
                    >
                      <div className="min-w-0">
                        <p className="font-medium leading-tight truncate">{detail.item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {detail.item.code}
                        </p>
                      </div>
                      <span className="text-right font-mono text-xs whitespace-nowrap">
                        {detail.quantity} {detail.item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
