'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: user,
    isLoading,
    error,
  } = trpc.users.me.useQuery(undefined, {
    retry: false,
    enabled: mounted,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      router.push('/login');
      router.refresh();
      toast.success('Logged out successfully');
    },
  });

  useEffect(() => {
    if (error) {
      router.push('/login');
    }
  }, [error, router]);

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Ingexpert Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user.email} ({user.role})
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
