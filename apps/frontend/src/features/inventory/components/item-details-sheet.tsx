'use client';

import { useMemo, useState } from 'react';
import { Boxes, ImageIcon, Loader2, MapPin, Package, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StorageImage } from '@/components/ui/storage-image';
import { trpc } from '@/lib/trpc';

import { type InventoryItem, LOW_STOCK_THRESHOLD, TYPE_CONFIG } from './inventory-table.types';
import { KitComponentsBuilder, type LocalComponent } from './kit-components-builder';

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
  if (stock < LOW_STOCK_THRESHOLD)
    return <Badge className="bg-orange-500 hover:bg-orange-500">Stock bajo</Badge>;
  return <Badge variant="outline">En stock</Badge>;
}

// ─── Kit components section ───────────────────────────────────────────────────

function KitComponentsSection({ kitId }: { kitId: string }) {
  const utils = trpc.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  const [localComponents, setLocalComponents] = useState<LocalComponent[]>([]);

  const { data: rawComponents, isLoading } = trpc.kits.getComponents.useQuery(kitId);

  const serverComponents = useMemo<LocalComponent[]>(() => {
    if (!rawComponents) return [];
    return rawComponents.map((c) => ({
      componentId: c.componentId,
      name: c.component.name,
      code: c.component.code,
      unit: c.component.unit,
      stock: Number(c.component.stock),
      quantity: Number(c.quantity),
    }));
  }, [rawComponents]);

  const setComponentsMutation = trpc.kits.setComponents.useMutation({
    onSuccess: () => {
      toast.success('Componentes actualizados');
      void utils.kits.getComponents.invalidate(kitId);
      setIsEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const clearKitMutation = trpc.kits.clearKit.useMutation({
    onSuccess: () => {
      toast.success('Componentes eliminados');
      void utils.kits.getComponents.invalidate(kitId);
      setIsEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const isPending = setComponentsMutation.isPending || clearKitMutation.isPending;

  const handleEdit = () => {
    setLocalComponents(serverComponents);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setLocalComponents([]);
  };

  const handleSave = () => {
    if (localComponents.length === 0) {
      clearKitMutation.mutate(kitId);
    } else {
      setComponentsMutation.mutate({
        kit_id: kitId,
        components: localComponents.map((c) => ({ item_id: c.componentId, quantity: c.quantity })),
      });
    }
  };

  const handleQuantityChange = (componentId: string, qty: number) => {
    setLocalComponents((prev) =>
      prev.map((c) =>
        c.componentId === componentId ? { ...c, quantity: Number.isNaN(qty) ? 1 : Math.max(1, qty) } : c,
      ),
    );
  };

  const handleRemove = (componentId: string) => {
    setLocalComponents((prev) => prev.filter((c) => c.componentId !== componentId));
  };

  const handleAdd = (item: LocalComponent) => {
    setLocalComponents((prev) => {
      if (prev.some((c) => c.componentId === item.componentId)) return prev;
      return [...prev, item];
    });
  };

  const displayComponents = isEditing ? localComponents : serverComponents;
  const excludeIds = useMemo(
    () => [kitId, ...localComponents.map((c) => c.componentId)],
    [kitId, localComponents],
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
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Boxes className="h-4 w-4 text-muted-foreground" />
          Componentes ({serverComponents.length})
        </p>
        {!isEditing ? (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleEdit}>
            <Pencil className="h-3 w-3 mr-1" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancel} disabled={isPending}>
              Cancelar
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
            </Button>
          </div>
        )}
      </div>

      {/* View mode: simple read-only list */}
      {!isEditing && (
        displayComponents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
            Este kit no tiene componentes asignados
          </p>
        ) : (
          <div className="border rounded-md divide-y text-sm">
            <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-1.5 bg-muted/40 text-xs font-medium text-muted-foreground">
              <span>Componente</span>
              <span className="text-right">Cantidad</span>
            </div>
            {displayComponents.map((comp) => (
              <div key={comp.componentId} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 items-center">
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
        )
      )}

      {/* Edit mode: shared builder */}
      {isEditing && (
        <KitComponentsBuilder
          components={localComponents}
          excludeIds={excludeIds}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onQtyChange={handleQuantityChange}
          disabled={isPending}
        />
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
          {!isKit && (
            item.imageUrl ? (
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
            )
          )}

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
            {/* Stock + unit — hidden for KIT items */}
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

          {/* Kit components */}
          {isKit && (
            <>
              <Separator />
              <KitComponentsSection kitId={item.id} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
