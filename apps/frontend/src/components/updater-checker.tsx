'use client';

import { useUpdater } from '@/hooks/use-updater';

export function UpdaterChecker() {
  useUpdater();
  return null;
}
