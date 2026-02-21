'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { CreateUserSchema, UserRole } from '@ingexpert/schema';
import { trpc } from '@/lib/trpc';
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

// Frontend-only schema: adds UI messages and confirm password field
const CreateUserFormSchema = CreateUserSchema.extend({
  email: z.string().email('Correo electrónico inválido'),
  name: z.string().max(100).optional().nullable(),
  role: z.nativeEnum(UserRole),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
  workArea: z.string().max(100).optional().nullable(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof CreateUserFormSchema>;

interface UserCreateSheetProps {
  open: boolean;
  onClose: () => void;
}

function PasswordInput({
  id,
  placeholder,
  disabled,
  value,
  onChange,
  onBlur,
  name,
}: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className="pr-10"
        disabled={disabled}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function UserCreateSheet({ open, onClose }: UserCreateSheetProps) {
  const utils = trpc.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: {
      email: '',
      name: '',
      role: 'USER',
      workArea: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        email: '',
        name: '',
        role: 'USER',
        workArea: '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [open, form]);

  const createMutation = trpc.adminUsers.create.useMutation({
    onSuccess: () => {
      toast.success('Usuario creado correctamente');
      void utils.adminUsers.list.invalidate();
      onClose();
    },
    onError: (error) => toast.error(error.message ?? 'Error al crear el usuario'),
  });

  const onSubmit = useCallback(
    ({ confirmPassword: _, name, workArea, ...rest }: FormValues) => {
      createMutation.mutate({
        ...rest,
        name: name || null,
        workArea: workArea || null,
      });
    },
    [createMutation],
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  const isPending = createMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Crear Nuevo Usuario
          </SheetTitle>
          <SheetDescription>
            El usuario podrá iniciar sesión con estas credenciales. Solo los administradores pueden
            crear cuentas.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4 mt-6">
            {/* Account info */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@empresa.com"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Input
                      placeholder="Ej: Taller A, Laboratorio"
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Mínimo 8 caracteres" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Repite la contraseña" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creando...' : 'Crear usuario'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
