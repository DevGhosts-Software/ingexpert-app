'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { UserRole } from '@ingexpert/schema';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, } from '@/components/ui/sheet';

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
  const filtered = workAreas.filter((a) => a.toLowerCase().includes(inputValue.toLowerCase()));
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

export function UserCreateSheet({ open, onClose }: UserCreateSheetProps) {
  const utils = trpc.useUtils();
  const { data: workAreas = [] } = trpc.adminUsers.getWorkAreas.useQuery();

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

  function invalidate() {
    void utils.adminUsers.list.invalidate();
    void utils.adminUsers.getStats.invalidate();
    void utils.adminUsers.getWorkAreas.invalidate();
  }

  const createMutation = trpc.adminUsers.create.useMutation({
    onSuccess: () => {
      toast.success('Usuario creado correctamente');
      invalidate();
      onClose();
    },
    onError: (error) => toast.error(error.message ?? 'Error al crear el usuario'),
  });

  const createWithoutAuthMutation = trpc.adminUsers.createWithoutAuth.useMutation({
    onSuccess: () => {
      toast.success('Usuario creado sin acceso al sistema');
      invalidate();
      onClose();
    },
    onError: (error) => toast.error(error.message ?? 'Error al crear el usuario'),
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
                      field={field as ControllerRenderProps<FormValues, 'workArea'>}
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
