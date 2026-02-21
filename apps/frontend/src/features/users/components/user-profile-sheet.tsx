'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogOut, UserCog } from 'lucide-react';
import { toast } from 'sonner';

import { trpc } from '@/lib/trpc';
import { useStorageUpload } from '@/hooks/use-storage-upload';
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
import {
  ImageUploadField,
  type ImageUploadFieldHandle,
} from '@/features/inventory/components/image-upload-field';
import type { User } from '@ingexpert/database';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const AvatarFormSchema = z.object({
  avatar: z.string().url().max(500).optional().nullable(),
});
type AvatarValues = z.infer<typeof AvatarFormSchema>;

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
  const imageFieldRef = useRef<ImageUploadFieldHandle>(null);
  const { uploadFile, deleteFile, isUploading } = useStorageUpload({ folder: 'uploads' });

  // ── Avatar form ──
  const avatarForm = useForm<AvatarValues>({
    resolver: zodResolver(AvatarFormSchema),
    defaultValues: { avatar: user.avatar ?? null },
  });

  const updateMeMutation = trpc.users.updateMe.useMutation({
    onSuccess: (_, variables) => {
      toast.success('Avatar actualizado');
      imageFieldRef.current?.reset();
      avatarForm.setValue('avatar', variables.avatar ?? null);
      utils.users.me.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const onAvatarSubmit = async (values: AvatarValues) => {
    const pendingFile = imageFieldRef.current?.getPendingFile() ?? null;
    let finalAvatarUrl = values.avatar ?? null;

    if (pendingFile) {
      try {
        finalAvatarUrl = await uploadFile(pendingFile);
      } catch {
        return; // uploadFile toasts the error
      }
      // Delete old avatar if replaced
      if (user.avatar && user.avatar !== finalAvatarUrl) {
        void deleteFile(user.avatar);
      }
    } else if (finalAvatarUrl === null && user.avatar) {
      // Avatar was explicitly removed — delete from storage
      void deleteFile(user.avatar);
    }

    updateMeMutation.mutate({ avatar: finalAvatarUrl });
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

  const isAvatarPending = updateMeMutation.isPending || isUploading;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-muted-foreground" />
            <SheetTitle>Mi Perfil</SheetTitle>
          </div>
          <SheetDescription>Actualiza tu avatar o contraseña.</SheetDescription>
        </SheetHeader>

        <Separator />

        {/* Info (read-only) */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm font-medium">Información de cuenta</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Correo electrónico</p>
            <p className="text-sm">{user.email}</p>
          </div>
          {user.name && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Nombre</p>
              <p className="text-sm">{user.name}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Avatar section */}
        <div className="px-6 py-5">
          <p className="text-sm font-medium mb-4">Foto de perfil</p>
          <Form {...avatarForm}>
            <form onSubmit={avatarForm.handleSubmit(onAvatarSubmit)} className="space-y-4">
              <FormField
                control={avatarForm.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUploadField
                        ref={imageFieldRef}
                        value={field.value ?? null}
                        onChange={(url) => field.onChange(url ?? null)}
                        disabled={isAvatarPending}
                        isUploading={isUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isAvatarPending} size="sm">
                  {isAvatarPending ? 'Guardando…' : 'Guardar avatar'}
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
