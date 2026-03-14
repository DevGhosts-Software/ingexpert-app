'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { UserRole } from '@ingexpert/schema';
import { createAdminUser, createAdminUserWithoutAuth } from '@/lib/admin-control-function';
import { useLocalWorkAreas } from '@/lib/api-migration-local-reads';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { WorkAreaCombobox } from './work-area-combobox';

// Single schema — password only required when noAuth is false
const CreateUserFormSchema = z
  .object({
    email: z.string().email('Correo electrónico inválido'),
    name: z.string().max(100).optional().nullable(),
    role: z.nativeEnum(UserRole),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    workArea: z.string().max(100).optional().nullable(),
    noAuth: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.noAuth) {
      if (!data.password || data.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Mínimo 8 caracteres',
        });
      }
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['confirmPassword'],
          message: 'Las contraseñas no coinciden',
        });
      }
    }
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
  const localWorkAreas = useLocalWorkAreas();
  const workAreas = localWorkAreas;

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: {
      email: '',
      name: '',
      role: 'USER',
      workArea: '',
      password: '',
      confirmPassword: '',
      noAuth: false,
    },
  });

  const noAuth = form.watch('noAuth');

  useEffect(() => {
    if (open) {
      form.reset({
        email: '',
        name: '',
        role: 'USER',
        workArea: '',
        password: '',
        confirmPassword: '',
        noAuth: false,
      });
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      toast.success('Usuario creado correctamente');
      onClose();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Error al crear el usuario'),
  });

  const createWithoutAuthMutation = useMutation({
    mutationFn: createAdminUserWithoutAuth,
    onSuccess: () => {
      toast.success('Usuario creado sin acceso al sistema');
      onClose();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Error al crear el usuario'),
  });

  const isPending = createMutation.isPending || createWithoutAuthMutation.isPending;

  const onSubmit = useCallback(
    ({ noAuth: isNoAuth, confirmPassword: _, name, workArea, password, ...rest }: FormValues) => {
      const base = { ...rest, name: name || null, workArea: workArea || null };
      if (isNoAuth) {
        createWithoutAuthMutation.mutate(base);
      } else {
        createMutation.mutate({ ...base, password: password! });
      }
    },
    [createMutation, createWithoutAuthMutation],
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Crear Nuevo Usuario
          </SheetTitle>
          <SheetDescription>
            {noAuth
              ? 'El usuario será registrado en el sistema pero no podrá iniciar sesión.'
              : 'El usuario podrá iniciar sesión con estas credenciales.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* No-auth toggle */}
            <FormField
              control={form.control}
              name="noAuth"
              render={({ field }) => (
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/40">
                  <Checkbox
                    id="no-auth"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                  <label htmlFor="no-auth" className="text-sm cursor-pointer leading-none">
                    Sin acceso al sistema{' '}
                    <span className="text-muted-foreground font-normal">
                      (no puede iniciar sesión)
                    </span>
                  </label>
                </div>
              )}
            />

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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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

            {!noAuth && (
              <>
                <Separator />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Mínimo 8 caracteres"
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Repite la contraseña"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
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
                {isPending ? 'Creando...' : 'Crear usuario'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
