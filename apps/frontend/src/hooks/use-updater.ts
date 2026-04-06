'use client';

import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useEffect, useRef } from 'react';

export function useUpdater() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function runUpdater() {
      console.log('Checking for updates...');

      try {
        const update = await check();

        if (update) {
          console.log(`Found update ${update.version} from ${update.date}`);

          let downloaded = 0;
          let contentLength = 0;

          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case 'Started':
                contentLength = event.data.contentLength ?? 0;
                console.log(`Started downloading ${contentLength} bytes`);
                break;
              case 'Progress':
                downloaded += event.data.chunkLength ?? 0;
                console.log(`Downloaded ${downloaded} of ${contentLength} bytes`);
                break;
              case 'Finished':
                console.log('Download finished. Installing...');
                break;
            }
          });

          console.log('Update installed! Restarting app...');
          await relaunch();
        } else {
          console.log('App is up to date.');
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    }

    runUpdater();
  }, []);
}
