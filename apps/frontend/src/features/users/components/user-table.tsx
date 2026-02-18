'use client';

import { useState } from 'react';
import {
  Search,
  UserPlus,
  MoreHorizontal,
  ArrowUpDown,
  ShieldCheck,
  User,
  Filter,
  ChevronDown,
  Trash2,
  KeyRound,
  Pencil,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

export type UserRole = 'ADMIN' | 'USER';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  workArea?: string;
  avatar?: string;
}

interface UserTableProps {
  users: AppUser[];
  isLoading?: boolean;
}

function RoleBadge({ role }: { role: UserRole }) {
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

function UserAvatar({ name, email }: { name?: string; email: string }) {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : email[0].toUpperCase();

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
      {initials}
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function InviteUserSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Crear Nuevo Usuario
          </SheetTitle>
          <SheetDescription>
            Solo los administradores pueden crear cuentas. El usuario recibirá sus credenciales por
            correo.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-1.5">
            <Label htmlFor="new-email">Correo electrónico</Label>
            <Input id="new-email" type="email" placeholder="usuario@empresa.com" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-name">Nombre completo</Label>
            <Input id="new-name" type="text" placeholder="Ej: Juan Pérez" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-role">Rol</Label>
            <Select defaultValue="USER">
              <SelectTrigger id="new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Usuario</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-area">Área de trabajo</Label>
            <Input id="new-area" type="text" placeholder="Ej: Taller A, Laboratorio" />
          </div>

          <Separator />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Crear usuario
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function UserTable({ users, isLoading = false }: UserTableProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [workAreaFilter, setWorkAreaFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof AppUser>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const workAreas = Array.from(
    new Set(users.map((u) => u.workArea).filter(Boolean)),
  ).sort() as string[];

  const filterUsers = (roleFilter: UserRole | 'ALL') => {
    return users
      .filter((u) => {
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        const matchesSearch =
          search === '' ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.workArea?.toLowerCase().includes(search.toLowerCase());
        const matchesArea = workAreaFilter === 'all' || u.workArea === workAreaFilter;
        return matchesRole && matchesSearch && matchesArea;
      })
      .sort((a, b) => {
        const av = String(a[sortField] ?? '');
        const bv = String(b[sortField] ?? '');
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  };

  const toggleSort = (field: keyof AppUser) => {
    if (sortField === field) setSortAsc((p) => !p);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = (visible: AppUser[]) => {
    const allSelected = visible.every((u) => selectedIds.has(u.id));
    setSelectedIds(allSelected ? new Set() : new Set(visible.map((u) => u.id)));
  };

  const tabItems: Array<{ value: string; label: string; role: UserRole | 'ALL' }> = [
    { value: 'all', label: 'Todos', role: 'ALL' },
    { value: 'admin', label: 'Administradores', role: 'ADMIN' },
    { value: 'user', label: 'Usuarios', role: 'USER' },
  ];

  const renderTable = (filtered: AppUser[]) => {
    const allSelected = filtered.length > 0 && filtered.every((u) => selectedIds.has(u.id));
    const someSelected = filtered.some((u) => selectedIds.has(u.id));

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected && !allSelected ? 'indeterminate' : undefined}
                  onCheckedChange={() => toggleSelectAll(filtered)}
                  aria-label="Seleccionar todo"
                />
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('name')}
                  className="flex items-center gap-1 hover:text-foreground font-medium"
                >
                  Usuario
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('email')}
                  className="flex items-center gap-1 hover:text-foreground font-medium"
                >
                  Correo
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort('workArea')}
                  className="flex items-center gap-1 hover:text-foreground font-medium"
                >
                  Área
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id} data-selected={selectedIds.has(user.id)}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(user.id)}
                      onCheckedChange={() => toggleSelect(user.id)}
                      aria-label={`Seleccionar ${user.name ?? user.email}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} email={user.email} />
                      <span className="font-medium">{user.name ?? '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    {user.workArea ? (
                      <span className="text-sm">{user.workArea}</span>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-300 text-xs"
                      >
                        Sin asignar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar usuario
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <KeyRound className="h-4 w-4 mr-2" />
                          Restablecer contraseña
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          {user.role === 'ADMIN' ? (
                            <>
                              <User className="h-4 w-4 mr-2" />
                              Cambiar a Usuario
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Promover a Admin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar usuario
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, correo o área..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="h-4 w-4" />
                  Filtros
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 p-3" align="start">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Área de Trabajo
                    </p>
                    <Select value={workAreaFilter} onValueChange={setWorkAreaFilter}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Todas las áreas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las áreas</SelectItem>
                        {workAreas.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {workAreaFilter !== 'all' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => setWorkAreaFilter('all')}
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Crear usuario
          </Button>
        </div>

        {/* Batch controls */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
            <span className="text-sm font-medium">
              {selectedIds.size} usuario(s) seleccionado(s)
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="destructive" size="sm" className="h-7 gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar selección
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => setSelectedIds(new Set())}
              >
                Cancelar selección
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList>
            {tabItems.map((tab) => {
              const count = filterUsers(tab.role).length;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                  {tab.label}
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                    {count}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabItems.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {renderTable(filterUsers(tab.role))}
            </TabsContent>
          ))}
        </Tabs>

        {!isLoading && (
          <p className="text-xs text-muted-foreground px-1">
            Mostrando {filterUsers('ALL').length} de {users.length} usuarios en total
          </p>
        )}
      </div>

      <InviteUserSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
