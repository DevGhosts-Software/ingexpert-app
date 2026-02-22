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

import type { ProjectRow } from './project-table.types';

interface ProjectDeleteSheetProps {
  project: ProjectRow | null;
  open: boolean;
  onClose: () => void;
}

export function ProjectDeleteSheet({ project, open, onClose }: ProjectDeleteSheetProps) {
  const utils = trpc.useUtils();

  const deleteMutation = trpc.projects.remove.useMutation({
    onSuccess: () => {
      toast.success(`"${project?.name}" eliminado correctamente`);
      void utils.projects.list.invalidate();
      void utils.projects.getAll.invalidate();
      void utils.movements.getAll.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message ?? 'Error al eliminar proyecto'),
  });

  if (!project) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-sm p-4">
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
            <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(project.id)}
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
