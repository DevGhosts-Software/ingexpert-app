'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useState } from 'react';
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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
