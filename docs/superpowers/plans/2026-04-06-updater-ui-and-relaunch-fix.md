# Updater UI & Relaunch Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `relaunch()` bug (missing process plugin) and add a sonner toast with download progress bar to the auto-updater.

**Architecture:** Two changes — (1) Rust side: register `tauri-plugin-process` alongside existing `tauri-plugin-updater`. (2) Frontend side: refactor `useUpdater` to expose reactive state (`status`, `progress`, `version`) and create an `UpdaterToast` component that renders a sonner toast with progress.

**Tech Stack:** Tauri v2, React, Sonner, `tauri-plugin-process`

---

## File Map

```
apps/frontend/src-tauri/Cargo.toml              ← ADD tauri-plugin-process
apps/frontend/src-tauri/src/lib.rs              ← REGISTER tauri-plugin-process
apps/frontend/src/hooks/use-updater.ts          ← EXPOSE STATE, REMOVE DEBUG LOGS
apps/frontend/src/components/updater-checker.tsx ← PASS STATE TO UpdaterToast
apps/frontend/src/components/updater-toast.tsx   ← NEW: sonner toast with progress
```

---

## Task 1: Add tauri-plugin-process to Cargo.toml

**Files:**
- Modify: `apps/frontend/src-tauri/Cargo.toml`

- [ ] **Step 1: Add the dependency**

Find the `[dependencies]` section and add `tauri-plugin-process`:

```toml
[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
log = "0.4"
tauri = { version = "2.10.0", features = [] }
tauri-plugin-log = "2"
tauri-plugin-process = "2"   # ADD THIS LINE

[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]
tauri-plugin-updater = "2"
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src-tauri/Cargo.toml
git commit -m "fix: add tauri-plugin-process for relaunch support"
```

---

## Task 2: Register tauri-plugin-process in lib.rs

**Files:**
- Modify: `apps/frontend/src-tauri/src/lib.rs`

- [ ] **Step 1: Add the plugin registration**

Change `lib.rs` from:
```rust
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

To:
```rust
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src-tauri/src/lib.rs
git commit -m "fix: register tauri-plugin-process in lib.rs for relaunch() support"
```

---

## Task 3: Refactor useUpdater to expose state and remove debug logs

**Files:**
- Modify: `apps/frontend/src/hooks/use-updater.ts`

- [ ] **Step 1: Rewrite the hook**

Replace the entire file content:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/hooks/use-updater.ts
git commit -m "refactor: expose UpdaterState from useUpdater and remove debug logs"
```

---

## Task 4: Create UpdaterToast component

**Files:**
- Create: `apps/frontend/src/components/updater-toast.tsx`

- [ ] **Step 1: Write the component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/updater-toast.tsx
git commit -m "feat: add UpdaterToast component with sonner progress bar"
```

---

## Task 5: Wire UpdaterChecker to use UpdaterToast

**Files:**
- Modify: `apps/frontend/src/components/updater-checker.tsx`

- [ ] **Step 1: Update the component**

Replace the entire file:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/updater-checker.tsx
git commit -m "feat: wire UpdaterToast to UpdaterChecker state"
```

---

## Verification

- [ ] `pnpm tauri build` succeeds (no Rust compilation errors from missing plugin)
- [ ] On Linux: update flow — toast appears with progress bar, app relaunches automatically after download completes (no "plugin missing" error)
- [ ] No `console.log` calls in `use-updater.ts`
- [ ] Toast is dismissed when no update is available
- [ ] Run `pnpm build --filter=@ingexpert/frontend` to verify frontend compiles cleanly
