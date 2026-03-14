'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

import { useStorageUpload } from '@/hooks/use-storage-upload';
import { usePowerSyncDatabase } from '@/components/providers/powersync-provider';
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
  const { deleteFile } = useStorageUpload();
  const powerSyncDb = usePowerSyncDatabase();
  const [isDeleting, setIsDeleting] = useState(false);

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
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                setIsDeleting(true);
                void powerSyncDb
                  .writeTransaction(async (tx) => {
                    await tx.execute('DELETE FROM kit_details WHERE kit_id = ? OR item_id = ?', [
                      item.id,
                      item.id,
                    ]);
                    await tx.execute('DELETE FROM items WHERE id = ?', [item.id]);
                  })
                  .then(() => {
                    toast.success(`"${item.name}" eliminado correctamente`);
                    if (item.imageUrl) void deleteFile(item.imageUrl);
                    onClose();
                  })
                  .catch((error: unknown) => {
                    const message =
                      error instanceof Error ? error.message : 'Error al eliminar el ítem';
                    toast.error(message);
                  })
                  .finally(() => {
                    setIsDeleting(false);
                  });
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
