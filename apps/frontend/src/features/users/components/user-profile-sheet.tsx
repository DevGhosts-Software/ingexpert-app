'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogOut, UserCog } from 'lucide-react';
import { toast } from 'sonner';

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
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { User } from '@ingexpert/database';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ProfileFormSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  avatar: z.string().url('URL inválida').max(500).optional().nullable().or(z.literal('')),
});
type ProfileValues = z.infer<typeof ProfileFormSchema>;

const PasswordFormSchema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
type PasswordValues = z.infer<typeof PasswordFormSchema>;

// ─── PasswordInput ─────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

interface UserProfileSheetProps {
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'role'>;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function UserProfileSheet({ user, open, onClose, onLogout }: UserProfileSheetProps) {
  const utils = trpc.useUtils();

  // ── Profile form ──
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: user.name ?? '',
      avatar: user.avatar ?? '',
    },
  });

  const updateMeMutation = trpc.users.updateMe.useMutation({
    onSuccess: () => {
      toast.success('Perfil actualizado');
      utils.users.me.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const onProfileSubmit = (values: ProfileValues) => {
    updateMeMutation.mutate({
      name: values.name || null,
      avatar: values.avatar || null,
    });
  };

  // ── Password form ──
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(PasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const updatePasswordMutation = trpc.users.updateMyPassword.useMutation({
    onSuccess: () => {
      toast.success('Contraseña actualizada');
      passwordForm.reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const onPasswordSubmit = (values: PasswordValues) => {
    updatePasswordMutation.mutate({ password: values.password });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-muted-foreground" />
            <SheetTitle>Mi Perfil</SheetTitle>
          </div>
          <SheetDescription>Actualiza tu nombre, avatar o contraseña.</SheetDescription>
        </SheetHeader>

        <Separator />

        {/* Profile section */}
        <div className="px-6 py-5">
          <p className="text-sm font-medium mb-4">Información personal</p>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <Input value={user.email} disabled />
              </FormItem>

              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu nombre completo"
                        disabled={updateMeMutation.isPending}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de avatar</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://..."
                        disabled={updateMeMutation.isPending}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={updateMeMutation.isPending} size="sm">
                  {updateMeMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <Separator />

        {/* Password section */}
        <div className="px-6 py-5">
          <p className="text-sm font-medium mb-4">Cambiar contraseña</p>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Mínimo 8 caracteres"
                        disabled={updatePasswordMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Repite la contraseña"
                        disabled={updatePasswordMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={updatePasswordMutation.isPending} size="sm">
                  {updatePasswordMutation.isPending ? 'Actualizando…' : 'Cambiar contraseña'}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <Separator />

        {/* Logout */}
        <div className="px-6 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
