'use client';

import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type UpdaterStatus = 'idle' | 'checking' | 'downloading' | 'installed';

export interface UpdaterState {
  status: UpdaterStatus;
  progress: number;
  version?: string;
}

export function useUpdater(): UpdaterState {
  const hasRun = useRef(false);
  const [state, setState] = useState<UpdaterState>({ status: 'idle', progress: 0 });

  const updateState = useCallback((partial: Partial<UpdaterState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function runUpdater() {
      updateState({ status: 'checking', progress: 0 });

      try {
        const { data: { session } } = await supabase.auth.getSession();

        const update = await check({
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });

        if (update) {
          updateState({ status: 'downloading', progress: 0, version: update.version });

          let downloaded = 0;
          let contentLength = 0;

          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case 'Started':
                contentLength = event.data.contentLength ?? 0;
                break;
              case 'Progress':
                downloaded += event.data.chunkLength ?? 0;
                if (contentLength > 0) {
                  updateState({ progress: Math.round((downloaded / contentLength) * 100) });
                }
                break;
              case 'Finished':
                updateState({ status: 'installed', progress: 100 });
                break;
            }
          });

          await relaunch();
        } else {
          updateState({ status: 'idle', progress: 0 });
        }
      } catch {
        updateState({ status: 'idle', progress: 0 });
      }
    }

    runUpdater();
  }, [updateState]);

  return state;
}
