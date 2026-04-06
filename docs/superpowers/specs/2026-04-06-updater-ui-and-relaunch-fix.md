# Updater UI & Relaunch Fix

**Date:** 2026-04-06
**Status:** Draft

## Problem Statement

Two issues with the Tauri auto-updater:

1. **Relaunch fails on Linux** — `relaunch()` from `@tauri-apps/plugin-process` throws "plugin missing" because `tauri-plugin-process` is not registered in `lib.rs`. Update downloads and installs correctly, but the app doesn't restart automatically.
2. **No user-facing progress UI** — The download progress is logged to console but users see no UI feedback during update download.

## Goal

Fix the relaunch bug and add a sonner toast with progress bar during update download.

---

## Approach

**Relaunch fix** — Add `tauri-plugin-process` to `Cargo.toml` and register it in `lib.rs`.

**Progress UI** — Use existing `Progress` component + sonner's toast `progress` option. State flows from `useUpdater` hook → `UpdaterToast` component → sonner toast.

---

## File Map

```
apps/frontend/src-tauri/Cargo.toml              ← ADD tauri-plugin-process
apps/frontend/src-tauri/src/lib.rs              ← REGISTER tauri-plugin-process
apps/frontend/src/hooks/use-updater.ts          ← EXPOSE STATE, REMOVE DEBUG LOGS
apps/frontend/src/components/updater-checker.tsx ← PASS STATE TO UPDATERTOAST
apps/frontend/src/components/updater-toast.tsx  ← NEW: SONNER TOAST WITH PROGRESS
```

---

## State Machine

```
idle
  └─→ checking (on mount)
          └─→ downloading (update found, download started, progress 0-100)
                  └─→ installed (download finished)
                          └─→ [app restarts via relaunch()]
          └─→ idle (no update available)
          └─→ idle (error)
```

**State shape:**
```typescript
type UpdaterStatus = 'idle' | 'checking' | 'downloading' | 'installed';

interface UpdaterState {
  status: UpdaterStatus;
  progress: number; // 0-100
  version?: string;
}
```

---

## Component Design

### `useUpdater` (modified)

- Returns `{ status, progress, version }` — not `void`
- Removes all `console.log` calls (debug noise)
- Emits `started` / `progress` / `finished` / `error` events via callback or state
- Keeps existing ref guard (`hasRun.current`) to prevent double execution

### `UpdaterChecker` (modified)

```tsx
const state = useUpdater();
<UpdaterToast {...state} />
```

### `UpdaterToast` (new)

A client component that:
- Renders nothing to the page (`return null`)
- Listens to `UpdaterState` changes via props
- Calls `toast()` with sonner's `{ progress }` option
- Uses a stable toast ID (`'updater-progress'`) to update same toast across progress events
- Shows `version` in title when downloading starts

**Toast phases:**
| status | toast title | description | progress |
|---|---|---|---|
| `idle` | — | dismiss toast | — |
| `checking` | — | (no toast yet) | — |
| `downloading` | `Descargando actualización` | `${progress}% de v${version}` | `progress / 100` |
| `installed` | `Actualización lista` | `Instalación completada. Reiniciando...` | `1` (100%) |

---

## Relaunch Fix

### `Cargo.toml`

Add `tauri-plugin-process` to dependencies:
```toml
tauri-plugin-process = "2"
```

### `lib.rs`

Register the plugin alongside updater:
```rust
.plugin(tauri_plugin_updater::Builder::new().build())
.plugin(tauri_plugin_process::init())
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| No update available | `status: 'idle'`, no toast shown |
| Network error on check | `console.error`, no toast |
| Download fails | `console.error`, toast shows error with manual retry option |
| Relaunch fails | `console.error`, app still works (update installed on next launch) |

---

## Verification Checklist

- [ ] Linux: update downloads, toast shows progress bar updating in real time
- [ ] Linux: after download completes, app relaunches automatically (no "plugin missing")
- [ ] Windows: same flow works correctly
- [ ] No debug `console.log` in production code
- [ ] Toast dismissed on `idle` (no update available or after relaunch)
- [ ] Existing app version is NOT affected when no update is available
