'use client';

import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { UserCog } from 'lucide-react';
import { toast } from 'sonner';

import { UpdateUserSchema, UserRole } from '@ingexpert/schema';
import { updateAdminUser } from '@/lib/admin-control-function';
import { useLocalWorkAreas } from '@/lib/api-migration-local-reads';
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
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { UserEntity } from './user-table.types';
import { WorkAreaCombobox } from './work-area-combobox';

const EditUserFormSchema = UpdateUserSchema.extend({
  name: z.string().max(100).optional().nullable(),
  workArea: z.string().max(100).optional().nullable(),
  role: z.nativeEnum(UserRole).optional(),
});

type FormValues = z.infer<typeof EditUserFormSchema>;

interface UserEditSheetProps {
  user: UserEntity;
  open: boolean;
  onClose: () => void;
  canChangeRole: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UserEditSheet({ user, open, onClose, canChangeRole }: UserEditSheetProps) {
  const localWorkAreas = useLocalWorkAreas();
  const workAreas = localWorkAreas;

  const form = useForm<FormValues>({
    resolver: zodResolver(EditUserFormSchema),
    defaultValues: {
      name: user.name ?? '',
      workArea: user.workArea ?? '',
      role: user.role,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: user.name ?? '',
        workArea: user.workArea ?? '',
        role: user.role,
      });
    }
  }, [open, user, form]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) => updateAdminUser(id, data),
    onSuccess: () => {
      toast.success('Usuario actualizado correctamente');
      onClose();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el usuario'),
  });

  const onSubmit = useCallback(
    ({ name, workArea, role }: FormValues) => {
      updateMutation.mutate({
        id: user.id,
        data: {
          name: name || null,
          workArea: workArea || null,
          role,
        },
      });
    },
    [updateMutation, user.id],
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  const isPending = updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Editar Usuario
          </SheetTitle>
          <SheetDescription>{user.name ?? user.email}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nombre completo{' '}
                    <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Juan Pérez"
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Área de trabajo{' '}
                    <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <WorkAreaCombobox
                      value={field.value}
                      onChange={field.onChange}
                      workAreas={workAreas}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canChangeRole && (
              <>
                <Separator />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USER">Usuario</SelectItem>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Separator />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
