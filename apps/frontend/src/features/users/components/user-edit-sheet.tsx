'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCog } from 'lucide-react';
import { toast } from 'sonner';
import type { ControllerRenderProps } from 'react-hook-form';

import { UpdateUserSchema, UserRole } from '@ingexpert/schema';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
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

// ─── WorkArea autocomplete ────────────────────────────────────────────────────

function WorkAreaCombobox({
  field,
  workAreas,
  disabled,
}: {
  field: ControllerRenderProps<FormValues, 'workArea'>;
  workAreas: string[];
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const inputValue = field.value ?? '';
  const filtered = workAreas.filter((a) =>
    a.toLowerCase().includes(inputValue.toLowerCase()),
  );
  const showDropdown = open && filtered.length > 0;

  const select = (area: string) => {
    field.onChange(area);
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
      select(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Input
        placeholder="Ej: Taller A, Laboratorio"
        disabled={disabled}
        value={inputValue}
        onChange={(e) => {
          field.onChange(e.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
          field.onBlur();
        }}
        onKeyDown={handleKeyDown}
      />
      {showDropdown && (
        <ul className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md p-1 max-h-48 overflow-auto">
          {filtered.map((area, i) => (
            <li
              key={area}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(area)}
              className={cn(
                'flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm',
                i === highlighted
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {area}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UserEditSheet({ user, open, onClose, canChangeRole }: UserEditSheetProps) {
  const utils = trpc.useUtils();
  const { data: workAreas = [] } = trpc.adminUsers.getWorkAreas.useQuery();

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

  const updateMutation = trpc.adminUsers.update.useMutation({
    onSuccess: () => {
      toast.success('Usuario actualizado correctamente');
      void utils.adminUsers.list.invalidate();
      void utils.adminUsers.getStats.invalidate();
      void utils.adminUsers.getWorkAreas.invalidate();
      onClose();
    },
    onError: (error) => toast.error(error.message ?? 'Error al actualizar el usuario'),
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
          <SheetDescription>
            {user.name ?? user.email}
          </SheetDescription>
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
                    <WorkAreaCombobox field={field} workAreas={workAreas} disabled={isPending} />
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
