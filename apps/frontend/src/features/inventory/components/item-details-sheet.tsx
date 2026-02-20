'use client';

import { ImageIcon, MapPin, Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StorageImage } from '@/components/ui/storage-image';

import { type InventoryItem, LOW_STOCK_THRESHOLD, TYPE_CONFIG } from './inventory-table.types';

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
  if (stock < LOW_STOCK_THRESHOLD)
    return <Badge className="bg-orange-500 hover:bg-orange-500">Stock bajo</Badge>;
  return <Badge variant="outline">En stock</Badge>;
}

export function ItemDetailsSheet({ item, open, onClose }: ItemDetailsSheetProps) {
  if (!item) return null;

  const { label: typeLabel, icon: TypeIcon } = TYPE_CONFIG[item.type];

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
          {/* Image */}
          {item.imageUrl ? (
            <div className="w-full rounded-lg border overflow-hidden bg-muted/30">
              <StorageImage src={item.imageUrl} alt={item.name} className="w-full h-48 object-contain" />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-32 rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <ImageIcon className="h-8 w-8 opacity-50" />
                <span className="text-xs">Sin imagen</span>
              </div>
            </div>
          )}

          <Separator />

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
            <DetailRow
              label="Stock"
              value={
                <span className="font-mono">
                  {item.stock} {item.unit}
                </span>
              }
            />
            <DetailRow label="Estado" value={<StockBadge stock={item.stock} />} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
