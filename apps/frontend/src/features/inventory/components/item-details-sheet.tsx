'use client';

import { useMemo } from 'react';
import { Boxes, ImageIcon, Loader2, MapPin, Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StorageImage } from '@/components/ui/storage-image';
import { trpc } from '@/lib/trpc';

import { type InventoryItem, TYPE_CONFIG } from './inventory-table.types';

// ─── Shared helpers ───────────────────────────────────────────────────────────

interface ItemDetailsSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2">
      <span className="text-sm text-muted-foreground min-w-24">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="destructive">Sin stock</Badge>;
  return <Badge variant="outline">En stock</Badge>;
}

// ─── Kit components (read-only) ───────────────────────────────────────────────

function KitComponentsReadonly({ kitId }: { kitId: string }) {
  const { data: rawComponents, isLoading } = trpc.kits.getComponents.useQuery(kitId);

  const components = useMemo(
    () =>
      (rawComponents ?? []).map((c) => ({
        id: c.componentId,
        name: c.component.name,
        code: c.component.code,
        unit: c.component.unit,
        quantity: Number(c.quantity),
      })),
    [rawComponents],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando componentes...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-1.5">
        <Boxes className="h-4 w-4 text-muted-foreground" />
        Componentes ({components.length})
      </p>
      {components.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
          Este kit no tiene componentes asignados
        </p>
      ) : (
        <div className="border rounded-md divide-y text-sm">
          <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-1.5 bg-muted/40 text-xs font-medium text-muted-foreground">
            <span>Componente</span>
            <span className="text-right">Cantidad</span>
          </div>
          {components.map((comp) => (
            <div key={comp.id} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 items-center">
              <div className="min-w-0">
                <p className="font-medium leading-tight truncate">{comp.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{comp.code}</p>
              </div>
              <span className="text-right font-mono text-xs whitespace-nowrap">
                {comp.quantity} {comp.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

export function ItemDetailsSheet({ item, open, onClose }: ItemDetailsSheetProps) {
  if (!item) return null;

  const { label: typeLabel, icon: TypeIcon } = TYPE_CONFIG[item.type];
  const isKit = item.type === 'KIT';

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalles del Ítem
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Image — hidden for KIT items */}
          {!isKit &&
            (item.imageUrl ? (
              <div className="w-full rounded-lg border overflow-hidden bg-muted/30">
                <StorageImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-48 object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-32 rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon className="h-8 w-8 opacity-50" />
                  <span className="text-xs">Sin imagen</span>
                </div>
              </div>
            ))}

          {!isKit && <Separator />}

          {/* Fields */}
          <div className="divide-y">
            <DetailRow label="Nombre" value={item.name} />
            <DetailRow label="Código" value={<span className="font-mono">{item.code}</span>} />
            <DetailRow
              label="Tipo"
              value={
                <Badge variant={TYPE_CONFIG[item.type].variant} className="gap-1 font-normal">
                  <TypeIcon className="h-3 w-3" />
                  {typeLabel}
                </Badge>
              }
            />
            <DetailRow
              label="Ubicación"
              value={
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {item.location}
                </span>
              }
            />
            {!isKit && (
              <>
                <DetailRow
                  label="Stock"
                  value={
                    <span className="font-mono">
                      {item.stock} {item.unit}
                    </span>
                  }
                />
                <DetailRow label="Estado" value={<StockBadge stock={item.stock} />} />
              </>
            )}
          </div>

          {isKit && (
            <>
              <Separator />
              <KitComponentsReadonly kitId={item.id} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
