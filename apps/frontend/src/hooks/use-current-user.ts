'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@powersync/react';
import { supabase } from '@/lib/supabase';

type LocalCurrentUserRow = {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SUPERADMIN';
  name: string | null;
  avatar: string | null;
  has_auth: number | string | null;
};

type CurrentUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SUPERADMIN';
  name: string | null;
  avatar: string | null;
  has_auth: boolean;
};

export function useCurrentUser() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | undefined>(undefined);
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
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
  }, []);

  const escapedSessionUserId = sessionUserId?.replace(/'/g, "''");
  const userSql = escapedSessionUserId
    ? `
      SELECT id, email, role, name, avatar, has_auth
      FROM users
      WHERE id = '${escapedSessionUserId}'
      LIMIT 1
    `
    : 'SELECT id, email, role, name, avatar, has_auth FROM users WHERE 1 = 0';

  const localUserQuery = useQuery<LocalCurrentUserRow>(userSql);

  const user = useMemo<CurrentUser | null>(() => {
    const first = localUserQuery.data?.[0];
    if (!first) return null;
    return {
      id: first.id,
      email: first.email,
      role: first.role,
      name: first.name ?? null,
      avatar: first.avatar ?? null,
      has_auth: Number(first.has_auth ?? 0) === 1,
    };
  }, [localUserQuery.data]);

  return {
    user,
    sessionUserId,
    sessionExpiresAt,
    sessionResolved,
    isFetching: localUserQuery.isFetching,
  };
}
