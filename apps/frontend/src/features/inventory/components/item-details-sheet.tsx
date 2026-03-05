'use client';

import { useMemo } from 'react';
import { Boxes, ImageIcon, Loader2, MapPin, Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StorageImage } from '@/components/ui/storage-image';
import { trpc } from '@/lib/trpc';

import { type InventoryItem, type ItemType, TYPE_CONFIG } from './inventory-table.types';

// ─── Extended color config ────────────────────────────────────────────────────

const TYPE_COLORS: Record<
  ItemType,
  { bg: string; border: string; badge: string; description: string }
> = {
  PRODUCT: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Bien de consumo con control de stock',
  },
  EQUIPMENT: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    badge:
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
    description: 'Activo fijo o maquinaria',
  },
  TOOL: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    badge:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
    description: 'Herramienta manual o eléctrica',
  },
  KIT: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400',
    description: 'Conjunto de ítems agrupados',
  },
};

// ─── MetaRow ──────────────────────────────────────────────────────────────────

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-sm font-medium leading-snug">{value}</span>
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
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Componentes ({components.length})
      </h4>
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
            <div key={comp.id} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2.5 items-center">
              <div className="min-w-0">
                <p className="font-medium leading-tight truncate">{comp.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{comp.code}</p>
              </div>
              <span className="text-right font-mono text-sm whitespace-nowrap tabular-nums">
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

interface ItemDetailsSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
}

export function ItemDetailsSheet({ item, open, onClose }: ItemDetailsSheetProps) {
  if (!item) return null;

  const { label: typeLabel, icon: TypeIcon } = TYPE_CONFIG[item.type];
  const colors = TYPE_COLORS[item.type];
  const isKit = item.type === 'KIT';

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        {/* Colored type header */}
        <div className={`px-6 pt-6 pb-5 border-b ${colors.bg} ${colors.border}`}>
          <SheetHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={`gap-1.5 text-sm px-3 py-1 font-medium border ${colors.badge}`}>
                <TypeIcon className="h-4 w-4" />
                {typeLabel}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">{item.code}</span>
            </div>
            <div>
              <SheetTitle className="text-base">{item.name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{colors.description}</p>
            </div>
          </SheetHeader>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5 space-y-6">
            {/* Image — non-kit only */}
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

            {/* Metadata */}
            <div className="divide-y">
              {!isKit && (
                <MetaRow icon={MapPin} label="Ubicación" value={item.location} />
              )}
              {!isKit && (
                <MetaRow
                  icon={Package}
                  label="Stock"
                  value={
                    <span className="flex items-center gap-2">
                      <span className="font-mono">
                        {item.stock} {item.unit}
                      </span>
                      <StockBadge stock={item.stock} />
                    </span>
                  }
                />
              )}
            </div>

            {/* Kit components */}
            {isKit && (
              <>
                <Separator />
                <KitComponentsReadonly kitId={item.id} />
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
