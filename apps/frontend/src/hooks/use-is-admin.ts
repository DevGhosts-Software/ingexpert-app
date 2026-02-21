import { trpc } from '@/lib/trpc';

/**
 * Returns true if the currently authenticated user has the ADMIN role.
 * Reads from the TanStack Query cache populated by the dashboard layout —
 * no extra network request is made.
 */
export function useIsAdmin(): boolean {
  const { data: user } = trpc.users.me.useQuery(undefined, {
    staleTime: Infinity, // rely on the layout's fetch; never re-fetch on its own
  });
  return user?.role === 'ADMIN';
}
