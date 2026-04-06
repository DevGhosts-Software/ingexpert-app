'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { UpdaterState } from '@/hooks/use-updater';

const TOAST_ID = 'updater-progress';

export function UpdaterToast({ status, progress, version }: UpdaterState) {
  const prevStatus = useRef(status);

  useEffect(() => {
    if (status === 'idle') {
      toast.dismiss(TOAST_ID);
      return;
    }

    if (status === 'downloading') {
      toast(
        `Descargando actualización${version ? ` v${version}` : ''}`,
        {
          id: TOAST_ID,
          description: `${progress}% descargado`,
          progress: progress / 100,
        },
      );
    }

    if (status === 'installed') {
      toast.success('Actualización lista', {
        id: TOAST_ID,
        description: 'Instalación completada. Reiniciando...',
      });
    }
  }, [status, progress, version]);

  return null;
}
