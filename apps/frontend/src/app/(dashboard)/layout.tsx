'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { DashboardNavbar } from '@/components/dashboard-navbar';

const pageTitles: Record<string, string> = {
  '/': 'Panel Principal',
  '/inventory': 'Inventario',
  '/movements': 'Movimientos',
  '/admin/users': 'Gestión de Usuarios',
  '/settings': 'Configuración',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const {
    data: user,
    isPending,
    isError,
  } = trpc.users.me.useQuery(undefined, {
    retry: false,
    enabled: mounted,
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (isError) {
      router.push('/login');
      router.refresh();
    }
  }, [isError, router]);

  if (!mounted || isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const pageTitle = pageTitles[pathname] ?? 'Ingexpert';
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push('/login');
        router.refresh();
        toast.success('Logged out successfully');
      },
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardNavbar title={pageTitle} user={user} onLogout={handleLogout} />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
