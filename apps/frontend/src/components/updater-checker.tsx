'use client';

import { useUpdater } from '@/hooks/use-updater';
import { UpdaterToast } from './updater-toast';

export function UpdaterChecker() {
  const state = useUpdater();
  return (
    <>
      <UpdaterToast {...state} />
    </>
  );
}
