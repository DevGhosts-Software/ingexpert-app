'use client';

import { useState } from 'react';
import { ChevronDown, Filter, Plus, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { type ActiveTab, type RoleCounts, TAB_ITEMS } from './user-table.types';

interface UserTableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  workAreaFilter: string;
  onWorkAreaFilterChange: (value: string) => void;
  workAreas: string[];
  activeTab: ActiveTab;
  onActiveTabChange: (value: ActiveTab) => void;
  roleCounts: RoleCounts;
}

function CreateUserSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
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
              <Plus className="h-4 w-4 mr-2" />
              Crear usuario
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function UserTableToolbar({
  search,
  onSearchChange,
  workAreaFilter,
  onWorkAreaFilterChange,
  workAreas,
  activeTab,
  onActiveTabChange,
  roleCounts,
}: UserTableToolbarProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Search + filter + actions row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, correo o área..."
              className="pl-9"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
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
                  <Select value={workAreaFilter} onValueChange={onWorkAreaFilterChange}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todas las áreas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las áreas</SelectItem>
                      {workAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
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
                    onClick={() => onWorkAreaFilterChange('all')}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Crear usuario
        </Button>
      </div>

      {/* Role tabs */}
      <Tabs value={activeTab} onValueChange={(v) => onActiveTabChange(v as ActiveTab)}>
        <TabsList>
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                {roleCounts[tab.value]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <CreateUserSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
