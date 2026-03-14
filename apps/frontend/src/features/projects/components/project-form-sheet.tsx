'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderOpen, FolderPlus, Pencil, User } from 'lucide-react';
import { toast } from 'sonner';

import { CreateProjectSchema, type CreateProjectDto } from '@ingexpert/schema';
import { trpc } from '@/lib/trpc';
import { useLocalUserNames } from '@/lib/api-migration-local-reads';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { ProjectRow } from './project-table.types';

// ─── Form schema with UI messages ────────────────────────────────────────────

const ProjectFormSchema = CreateProjectSchema.extend({
  name: z.string().min(1, 'Nombre requerido'),
  contact: z.string().min(1, 'Contacto requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  managerId: z.string().uuid('Selecciona un responsable'),
});
type FormValues = CreateProjectDto;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectFormSheetProps {
  mode: 'create' | 'edit';
  project?: ProjectRow | null;
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectFormSheet({ mode, project, open, onClose }: ProjectFormSheetProps) {
  const utils = trpc.useUtils();
  const isEdit = mode === 'edit';
  const localUsers = useLocalUserNames();
  const users = localUsers;

  const form = useForm<FormValues>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues: { name: '', contact: '', address: '', managerId: '' },
  });

  // Populate form when editing
  useEffect(() => {
    if (open && isEdit && project) {
      form.reset({
        name: project.name,
        contact: project.contact,
        address: project.address,
        managerId: project.managerId,
      });
    } else if (!open) {
      form.reset({ name: '', contact: '', address: '', managerId: '' });
    }
  }, [open, isEdit, project, form]);

  function invalidateAll() {
    return Promise.all([
      utils.projects.list.invalidate(),
      utils.projects.getAll.invalidate(),
      // Also invalidate movements since they display project names
      utils.movements.getAll.invalidate(),
    ]);
  }

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success('Proyecto creado correctamente');
      void invalidateAll();
      onClose();
    },
    onError: (e) => toast.error(e.message ?? 'Error al crear proyecto'),
  });

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success('Proyecto actualizado correctamente');
      void invalidateAll();
      onClose();
    },
    onError: (e) => toast.error(e.message ?? 'Error al actualizar proyecto'),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: FormValues) {
    if (isEdit && project) {
      updateMutation.mutate({ id: project.id, ...values });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isEdit ? (
              <>
                <Pencil className="h-5 w-5" /> Editar Proyecto
              </>
            ) : (
              <>
                <FolderPlus className="h-5 w-5" /> Nuevo Proyecto
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? `Editando "${project?.name}"`
              : 'Completa los datos para registrar un nuevo proyecto.'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pr-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <FolderOpen className="inline h-3.5 w-3.5 mr-1" />
                      Nombre del proyecto
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Planta Industrial Norte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <User className="inline h-3.5 w-3.5 mr-1" />
                      Responsable
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un responsable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name ?? u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="Teléfono o email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección del proyecto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2 pb-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? isEdit
                      ? 'Guardando...'
                      : 'Creando...'
                    : isEdit
                      ? 'Guardar cambios'
                      : 'Crear proyecto'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
