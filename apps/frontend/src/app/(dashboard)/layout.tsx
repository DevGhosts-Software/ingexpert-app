'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  canUseOfflineValidatedUser,
  clearOfflineValidatedUser,
  readOfflineValidatedUser,
  writeOfflineValidatedUser,
} from '@/lib/auth/offline-session';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { DashboardNavbar } from '@/components/dashboard-navbar';

const pageTitles: Record<string, string> = {
  '/': 'Panel Principal',
  '/inventory': 'Inventario',
  '/movements': 'Movimientos',
  '/projects': 'Proyectos',
  '/admin/users': 'Gestión de Usuarios',
  '/settings': 'Configuración',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | undefined>(undefined);
  const [sessionResolved, setSessionResolved] = useState(false);
  const cachedUser = readOfflineValidatedUser();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let isActive = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isActive) return;
      setSessionUserId(session?.user.id ?? null);
      setSessionExpiresAt(session?.expires_at);
      setSessionResolved(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user.id ?? null);
      setSessionExpiresAt(session?.expires_at);
      setSessionResolved(true);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mounted]);

  const { data: user, isPending } = trpc.users.me.useQuery(undefined, {
    retry: false,
    enabled: mounted && isOnline && !!sessionUserId,
  });

  const utils = trpc.useUtils();

  useEffect(() => {
    if (!user) return;
    writeOfflineValidatedUser(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        avatar: user.avatar,
        hasAuth: user.hasAuth,
      },
      sessionExpiresAt ?? null,
    );
  }, [sessionExpiresAt, user]);

  const canUsePersistedSession = useMemo(
    () =>
      canUseOfflineValidatedUser({
        cachedUser,
        sessionUserId,
        sessionExpiresAt,
      }),
    [cachedUser, sessionExpiresAt, sessionUserId],
  );

  const canUseOfflineSession = useMemo(
    () => !isOnline && canUsePersistedSession,
    [canUsePersistedSession, isOnline],
  );

  const effectiveUser = user ?? (canUsePersistedSession ? cachedUser : null);

  useEffect(() => {
    if (!mounted || !sessionResolved || sessionUserId) {
      return;
    }
    if (!isOnline && canUseOfflineSession) {
      return;
    }
    if (isOnline) {
      clearOfflineValidatedUser();
    }
    router.replace('/login');
  }, [canUseOfflineSession, isOnline, mounted, router, sessionResolved, sessionUserId]);

  useEffect(() => {
    if (!mounted || !sessionResolved || isOnline) return;
    if (!canUseOfflineSession) {
      toast.error('Sin internet y sin sesión local válida. Inicia sesión al reconectar.');
      router.replace('/login');
    }
  }, [canUseOfflineSession, isOnline, mounted, router, sessionResolved]);

  useEffect(() => {
    if (!mounted || !isOnline || !sessionUserId) return;
    void utils.users.me.invalidate();
  }, [isOnline, mounted, sessionUserId, utils.users.me]);

  if (
    !mounted ||
    !sessionResolved ||
    (isOnline && !!sessionUserId && isPending && !effectiveUser)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando la aplicación...</p>
        </div>
      </div>
    );
  }

  if (!effectiveUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Restaurando sesión...</p>
        </div>
      </div>
    );
  }

  const rawPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  const pageTitle = pageTitles[rawPath] ?? 'Ingexpert';
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    clearOfflineValidatedUser();
    void utils.users.me.reset();
    router.push('/login');
    toast.success('Logged out successfully');
  };

  return (
    <SidebarProvider className="h-screen">
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <DashboardNavbar title={pageTitle} user={effectiveUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto p-6 min-h-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
