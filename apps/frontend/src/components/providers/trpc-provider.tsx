'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { supabase } from '@/lib/supabase';

function resolveTrpcUrl(rawApiUrl: string | undefined): string {
  const fallback = 'http://localhost:3001/trpc';
  const normalized = (rawApiUrl?.trim() || fallback).replace(/\/+$/, '');

  if (normalized.endsWith('/trpc')) {
    return normalized;
  }

  return `${normalized}/trpc`;
}

function AuthSync() {
  const refreshMutation = trpc.auth.refresh.useMutation();

  useEffect(() => {
    const revalidateSession = () => {
      refreshMutation.mutate();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        revalidateSession();
      }
    });

    const handleOnline = () => {
      revalidateSession();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
    // refreshMutation is stable — intentionally excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: resolveTrpcUrl(process.env.NEXT_PUBLIC_API_URL),
          async headers() {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
          },
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: 'include',
            });
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthSync />
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
