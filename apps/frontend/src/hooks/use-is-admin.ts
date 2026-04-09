import { readOfflineValidatedUser } from '@/lib/auth/offline-session';
import { useCurrentUser } from '@/hooks/use-current-user';

/**
 * Returns true if the currently authenticated user has the ADMIN role.
 * Reads from the TanStack Query cache populated by the dashboard layout —
 * no extra network request is made.
 */
export function useIsAdmin(): boolean {
  const { user } = useCurrentUser();

  if (user) {
    return user.role === 'ADMIN' || user.role === 'SUPERADMIN';
  }

  return (
    readOfflineValidatedUser()?.role === 'ADMIN' ||
    readOfflineValidatedUser()?.role === 'SUPERADMIN'
  );
}
