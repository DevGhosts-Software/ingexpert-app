'use client';

import { useMemo, useState } from 'react';
import { Boxes, ImageIcon, Loader2, MapPin, Package, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StorageImage } from '@/components/ui/storage-image';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useDebounce } from '@/hooks/use-debounce';

import { type InventoryItem, LOW_STOCK_THRESHOLD, TYPE_CONFIG } from './inventory-table.types';

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

type LocalComponent = {
  componentId: string;
  name: string;
  code: string;
  unit: string;
  stock: number;
  quantity: number;
};

function AddComponentInput({
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

  const { data: results } = trpc.items.list.useQuery(
    { page: 1, limit: 8, search: debouncedQuery || undefined },
    { enabled: debouncedQuery.trim().length >= 2 },
  );

  const filtered = useMemo(
    () =>
      (results?.data ?? [])
        .filter((i) => !excludeIds.includes(i.id))
        .map((i) => ({ ...i, stock: Number(i.stock) })),
    [results, excludeIds],
  );

  const showDropdown = open && debouncedQuery.trim().length >= 2 && filtered.length > 0;

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
        className="h-8 text-sm"
      />
      {showDropdown && (
        <ul className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
          {filtered.map((item, i) => (
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
              <span className="text-xs text-muted-foreground font-mono shrink-0">{item.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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

  const handleQuantityChange = (componentId: string, raw: string) => {
    const value = parseInt(raw, 10);
    setLocalComponents((prev) =>
      prev.map((c) =>
        c.componentId === componentId ? { ...c, quantity: Number.isNaN(value) ? 1 : Math.max(1, value) } : c,
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
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
            </Button>
          </div>
        )}
      </div>

      {displayComponents.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
          {isEditing ? 'Sin componentes — guarda para limpiar el kit' : 'Este kit no tiene componentes asignados'}
        </p>
      ) : (
        <div className="border rounded-md divide-y text-sm">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 bg-muted/40 text-xs font-medium text-muted-foreground">
            <span>Componente</span>
            <span className="text-right">Cantidad</span>
            {isEditing && <span />}
          </div>
          {displayComponents.map((comp) => (
            <div
              key={comp.componentId}
              className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 items-center"
            >
              <div className="min-w-0">
                <p className="font-medium leading-tight truncate">{comp.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{comp.code}</p>
              </div>
              {isEditing ? (
                <Input
                  type="number"
                  min={1}
                  value={comp.quantity}
                  onChange={(e) => handleQuantityChange(comp.componentId, e.target.value)}
                  className="h-7 w-16 text-xs text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  disabled={isPending}
                />
              ) : (
                <span className="text-right font-mono text-xs whitespace-nowrap">
                  {comp.quantity} {comp.unit}
                </span>
              )}
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(comp.componentId)}
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <AddComponentInput excludeIds={excludeIds} onAdd={handleAdd} disabled={isPending} />
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
          {/* Image */}
          {item.imageUrl ? (
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
