'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { type InventoryItem } from './inventory-table.types';

interface ItemDeleteDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
}

export function ItemDeleteDialog({ item, open, onClose }: ItemDeleteDialogProps) {
  const utils = trpc.useUtils();

  const deleteMutation = trpc.items.remove.useMutation({
    onSuccess: () => {
      toast.success(`"${item?.name}" eliminado correctamente`);
      void utils.items.list.invalidate();
      void utils.items.getStats.invalidate();
      void utils.items.getCounts.invalidate();
      void utils.items.getLocations.invalidate();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message ?? 'Error al eliminar el ítem');
    },
  });

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-sm p-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Ítem
          </SheetTitle>
          <SheetDescription>Esta acción no se puede deshacer.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border bg-destructive/5 border-destructive/20 p-4">
            <p className="text-sm font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Código: {item.code}</p>
            <p className="text-xs text-muted-foreground">Ubicación: {item.location}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar permanentemente este ítem del inventario?
          </p>

          <Separator />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(item.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
