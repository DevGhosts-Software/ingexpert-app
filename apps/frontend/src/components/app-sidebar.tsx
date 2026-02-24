'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeftRight, Boxes, FolderOpen, LayoutDashboard, Package, Users } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

import { useIsAdmin } from '@/hooks/use-is-admin';

const mainNavItems = [
  {
    title: 'Panel Principal',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Inventario',
    href: '/inventory',
    icon: Package,
  },
  {
    title: 'Movimientos',
    href: '/movements',
    icon: ArrowLeftRight,
  },
  {
    title: 'Proyectos',
    href: '/projects',
    icon: FolderOpen,
  },
];

const adminNavItems = [
  {
    title: 'Usuarios',
    href: '/admin/users',
    icon: Users,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = useIsAdmin();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <button onClick={() => router.push('/')}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Boxes className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Ingexpert</span>
                  <span className="truncate text-xs text-muted-foreground">Gestión de Stock</span>
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <button onClick={() => router.push(item.href)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Administración</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={pathname === item.href}>
                        <button onClick={() => router.push(item.href)}>
                          <item.icon />
                          <span>{item.title}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 text-xs text-muted-foreground">v0.1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
