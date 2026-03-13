'use client';

const OFFLINE_USER_CACHE_KEY = 'ingexpert.offlineValidatedUser';

export type OfflineValidatedUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  name: string | null;
  avatar: string | null;
  hasAuth: boolean;
  validatedAt: string;
  sessionExpiresAt: string | null;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function readOfflineValidatedUser(): OfflineValidatedUser | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(OFFLINE_USER_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const candidate = parsed as Partial<OfflineValidatedUser>;
    if (
      !candidate.id ||
      !candidate.email ||
      !candidate.role ||
      (candidate.role !== 'ADMIN' && candidate.role !== 'USER')
    ) {
      return null;
    }

    return {
      id: candidate.id,
      email: candidate.email,
      role: candidate.role,
      name: candidate.name ?? null,
      avatar: candidate.avatar ?? null,
      hasAuth: candidate.hasAuth ?? true,
      validatedAt: candidate.validatedAt ?? new Date(0).toISOString(),
      sessionExpiresAt: candidate.sessionExpiresAt ?? null,
    };
  } catch {
    return null;
  }
}

export function writeOfflineValidatedUser(
  user: Omit<OfflineValidatedUser, 'validatedAt' | 'sessionExpiresAt'>,
  sessionExpiresAt: number | null,
): void {
  if (!isBrowser()) {
    return;
  }

  const payload: OfflineValidatedUser = {
    ...user,
    validatedAt: new Date().toISOString(),
    sessionExpiresAt: sessionExpiresAt ? new Date(sessionExpiresAt * 1000).toISOString() : null,
  };

  window.localStorage.setItem(OFFLINE_USER_CACHE_KEY, JSON.stringify(payload));
}

export function clearOfflineValidatedUser(): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(OFFLINE_USER_CACHE_KEY);
}

export function canUseOfflineValidatedUser(params: {
  cachedUser: OfflineValidatedUser | null;
  sessionUserId: string | null;
  sessionExpiresAt: number | undefined;
}): boolean {
  const { cachedUser, sessionUserId, sessionExpiresAt } = params;
  if (!cachedUser) {
    return false;
  }

  if (sessionUserId && cachedUser.id !== sessionUserId) {
    return false;
  }

  const expiresAtMs =
    sessionExpiresAt && sessionExpiresAt > 0
      ? sessionExpiresAt * 1000
      : cachedUser.sessionExpiresAt
        ? Date.parse(cachedUser.sessionExpiresAt)
        : Number.NaN;

  if (!Number.isFinite(expiresAtMs)) {
    return false;
  }

  return Date.now() < expiresAtMs;
}
