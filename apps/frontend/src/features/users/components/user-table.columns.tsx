'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Briefcase,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  LockKeyholeOpen,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StorageAvatarImage } from '@/components/ui/storage-image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { UserEditSheet } from './user-edit-sheet';
import type { UserEntity, UserRole } from './user-table.types';

// ─── Permission helpers ───────────────────────────────────────────────────────

function canEdit(currentId: string, target: UserEntity): boolean {
  if (target.id === currentId) return true; // can always edit yourself
  if (target.role === 'ADMIN') return false; // can't edit other admins
  return true;
}

function canDelete(currentId: string, target: UserEntity): boolean {
  if (target.id === currentId) return false; // can't delete yourself
  if (target.role === 'ADMIN') return false; // can't delete other admins
  return true;
}

// ─── Shared password input ────────────────────────────────────────────────────

function PasswordInput({ placeholder, disabled, ...props }: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className="pr-10"
        disabled={disabled}
        {...props}
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

// ─── Reset password dialog ────────────────────────────────────────────────────

const ResetPwSchema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPwValues = z.infer<typeof ResetPwSchema>;

function ResetPasswordDialog({
  user,
  open,
  onClose,
}: {
  user: UserEntity;
  open: boolean;
  onClose: () => void;
}) {
  const form = useForm<ResetPwValues>({
    resolver: zodResolver(ResetPwSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const mutation = trpc.adminUsers.updatePassword.useMutation({
    onSuccess: () => {
      toast.success('Contraseña restablecida correctamente');
      form.reset();
      onClose();
    },
    onError: (err) => toast.error(err.message ?? 'Error al restablecer la contraseña'),
  });

  const onSubmit = ({ password }: ResetPwValues) => {
    mutation.mutate({ id: user.id, password });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Restablecer contraseña
          </DialogTitle>
          <DialogDescription>{user.name ?? user.email}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Mínimo 8 caracteres"
                      disabled={mutation.isPending}
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
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Restablecer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Grant auth dialog ────────────────────────────────────────────────────────

const GrantAuthPwSchema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type GrantAuthPwValues = z.infer<typeof GrantAuthPwSchema>;

function GrantAuthDialog({
  user,
  open,
  onClose,
}: {
  user: UserEntity;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const form = useForm<GrantAuthPwValues>({
    resolver: zodResolver(GrantAuthPwSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const mutation = trpc.adminUsers.grantAuth.useMutation({
    onSuccess: () => {
      toast.success(`Acceso otorgado a ${user.name ?? user.email}`);
      void utils.adminUsers.list.invalidate();
      form.reset();
      onClose();
    },
    onError: (err) => toast.error(err.message ?? 'Error al otorgar acceso'),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockKeyholeOpen className="h-4 w-4" />
            Dar acceso al sistema
          </DialogTitle>
          <DialogDescription>
            Crea credenciales de inicio de sesión para{' '}
            <span className="font-medium text-foreground">{user.name ?? user.email}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(({ password }) =>
              mutation.mutate({ id: user.id, password }),
            )}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Mínimo 8 caracteres"
                      disabled={mutation.isPending}
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
                      disabled={mutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Dar acceso
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Revoke auth dialog ───────────────────────────────────────────────────────

function RevokeAuthDialog({
  user,
  open,
  onClose,
}: {
  user: UserEntity;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const mutation = trpc.adminUsers.revokeAuth.useMutation({
    onSuccess: () => {
      toast.success(`Acceso revocado para ${user.name ?? user.email}`);
      void utils.adminUsers.list.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message ?? 'Error al revocar acceso'),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockKeyhole className="h-4 w-4 text-destructive" />
            Revocar acceso al sistema
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{user.name ?? user.email}</span> ya no
            podrá iniciar sesión. Su registro en el sistema se mantiene.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate(user.id)}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Revocar acceso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteUserDialog({
  user,
  open,
  onClose,
}: {
  user: UserEntity;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();

  const mutation = trpc.adminUsers.remove.useMutation({
    onSuccess: () => {
      toast.success('Usuario eliminado correctamente');
      void utils.adminUsers.list.invalidate();
      void utils.adminUsers.getStats.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message ?? 'Error al eliminar el usuario'),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            Eliminar usuario
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar a{' '}
            <span className="font-medium text-foreground">{user.name ?? user.email}</span>? Esta
            acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate(user.id)}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function RowActions({ user }: { user: UserEntity }) {
  const [editOpen, setEditOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  const { data: me } = trpc.users.me.useQuery();
  const currentId = me?.id ?? '';
  const isEditAllowed = canEdit(currentId, user);
  const isDeleteAllowed = canDelete(currentId, user);
  const isResetPasswordAllowed = user.hasAuth && (user.id === currentId || user.role !== 'ADMIN');
  const canChangeRole = user.id !== currentId && user.role !== 'ADMIN';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)} disabled={!isEditAllowed}>
            <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
            Editar usuario
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetPwOpen(true)} disabled={!isResetPasswordAllowed}>
            <KeyRound className="h-4 w-4 mr-2 text-muted-foreground" />
            Restablecer contraseña
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.hasAuth ? (
            <DropdownMenuItem
              onClick={() => setRevokeOpen(true)}
              disabled={user.id === currentId || user.role === 'ADMIN'}
              className="text-orange-600 focus:text-orange-600"
            >
              <LockKeyhole className="h-4 w-4 mr-2" />
              Revocar acceso
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setGrantOpen(true)}>
              <LockKeyholeOpen className="h-4 w-4 mr-2 text-muted-foreground" />
              Dar acceso
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={!isDeleteAllowed}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar usuario
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {editOpen && (
        <UserEditSheet
          user={user}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          canChangeRole={canChangeRole}
        />
      )}
      <ResetPasswordDialog user={user} open={resetPwOpen} onClose={() => setResetPwOpen(false)} />
      <GrantAuthDialog user={user} open={grantOpen} onClose={() => setGrantOpen(false)} />
      <RevokeAuthDialog user={user} open={revokeOpen} onClose={() => setRevokeOpen(false)} />
      <DeleteUserDialog user={user} open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </>
  );
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

export function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'ADMIN') {
    return (
      <Badge className="gap-1.5 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
        <ShieldCheck className="h-3 w-3" />
        Administrador
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1.5">
      <User className="h-3 w-3" />
      Usuario
    </Badge>
  );
}

export function UserAvatar({
  name,
  avatar,
  email,
}: {
  name: string | null;
  avatar: string | null;
  email: string;
}) {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : email[0].toUpperCase();

  return (
    <Avatar size="sm">
      {avatar && <StorageAvatarImage src={avatar} alt={name ?? email} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

export function getColumns(): ColumnDef<UserEntity>[] {
  return [
    {
      id: 'name',
      accessorFn: (row) => row.name ?? '',
      header: 'Usuario',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            name={row.original.name}
            avatar={row.original.avatar}
            email={row.original.email}
          />
          <span className="font-medium">{row.original.name ?? '—'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Correo',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.email}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'role',
      header: () => <div className="flex justify-center"><span className="font-medium">Rol</span></div>,
      cell: ({ row }) => <div className="flex justify-center"><RoleBadge role={row.original.role} /></div>,
      enableSorting: false,
    },
    {
      accessorKey: 'workArea',
      header: () => <div className="flex justify-center"><span className="font-medium">Área</span></div>,
      cell: ({ row }) =>
        <div className="flex justify-center">
          {row.original.workArea ? (
            <Badge variant="secondary" className="gap-1 font-normal">
              <Briefcase className="h-3 w-3" />
              {row.original.workArea}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground text-xs">
              Sin asignar
            </Badge>
          )}
        </div>,
      enableSorting: false,
    },
    {
      id: 'hasAuth',
      header: () => <div className="flex justify-center"><span className="font-medium">Acceso</span></div>,
      cell: ({ row }) =>
        <div className="flex justify-center">
          {row.original.hasAuth ? (
            <Badge
              variant="outline"
              className="gap-1 text-green-700 border-green-300 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            >
              <LockKeyholeOpen className="h-3 w-3" />
              Activo
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <LockKeyhole className="h-3 w-3" />
              Sin acceso
            </Badge>
          )}
        </div>,
      enableSorting: false,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => <div className="flex justify-center"><RowActions user={row.original} /></div>,
      enableSorting: false,
      size: 56,
    },
  ];
}
