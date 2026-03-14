'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useQuery } from '@powersync/react';

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

import type { ProjectRow } from './project-table.types';

interface ProjectDeleteSheetProps {
  project: ProjectRow | null;
  open: boolean;
  onClose: () => void;
}

export function ProjectDeleteSheet({ project, open, onClose }: ProjectDeleteSheetProps) {
  const powerSyncDb = usePowerSyncDatabase();
  const [isDeleting, setIsDeleting] = useState(false);
  const escapedProjectId = project?.id.replace(/'/g, "''") ?? '';
  const linkedMovementsSql = project
    ? `SELECT COUNT(*) AS total FROM movements WHERE project_id = '${escapedProjectId}'`
    : 'SELECT COUNT(*) AS total FROM movements WHERE 1 = 0';
  const linkedMovementsQuery = useQuery<{ total: number | string | null }>(linkedMovementsSql);

  if (!project) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-sm overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Proyecto
          </SheetTitle>
          <SheetDescription>Esta acción no se puede deshacer.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border bg-destructive/5 border-destructive/20 p-4">
            <p className="text-sm font-medium">{project.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Responsable: {project.manager}</p>
            <p className="text-xs text-muted-foreground">Contacto: {project.contact}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar este proyecto? Los movimientos asociados perderán
            su referencia al proyecto.
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
                const linkedCount = Number(linkedMovementsQuery.data?.[0]?.total ?? 0);
                if (linkedCount > 0) {
                  toast.error(
                    `No se puede eliminar "${project.name}": tiene ${linkedCount} movimiento${linkedCount > 1 ? 's' : ''} asociado${linkedCount > 1 ? 's' : ''}.`,
                  );
                  return;
                }

                setIsDeleting(true);
                void powerSyncDb
                  .writeTransaction(async (tx) => {
                    await tx.execute('DELETE FROM projects WHERE id = ?', [project.id]);
                  })
                  .then(() => {
                    toast.success(`"${project.name}" eliminado correctamente`);
                    onClose();
                  })
                  .catch((error: unknown) => {
                    const message =
                      error instanceof Error ? error.message : 'Error al eliminar proyecto';
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
